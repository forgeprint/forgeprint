# Setup

Creates a Rails 8.1 web application on SQLite with the built-in authentication
generator, one page behind sign-in, sessions that expire, a recurring job that
purges the expired ones, the generated CI workflow pinned by commit, and a
container image that is built, started and asked for its health.

Run every step from the empty directory that will hold the project. Each step
is one action and ends with the command that proves it worked. Stop at the
first verification that fails.

Requires Ruby 3.3 or newer from a version manager (rbenv, asdf, mise, or
`ruby/setup-ruby` in CI), so that gems install without elevated privileges;
Git, Docker and curl.

1. Install the pinned Rails, whose generator writes the rest of the project: `gem install rails --version 8.1.4 --no-document`
   Verify: `rails _8.1.4_ --version | grep -qx "Rails 8.1.4"`

2. Generate the application into this directory. SQLite, Propshaft, import maps and Solid Queue, Cache and Cable are the Rails 8 defaults and are named so the command means the same thing on a later Rails; Kamal, system tests, Action Mailbox, Action Text, Active Storage and Jbuilder are left out because nothing here uses or verifies them: `rails _8.1.4_ new . --name=webapp --database=sqlite3 --asset-pipeline=propshaft --javascript=importmap --skip-kamal --skip-system-test --skip-action-mailbox --skip-action-text --skip-active-storage --skip-jbuilder`
   Verify: `bin/rails --version | grep -qx "Rails 8.1.4"`

3. Replace `Gemfile` with every gem the application names pinned to an exact version:

   ```ruby
   source "https://rubygems.org"

   # Every gem the application names is pinned to an exact version, so the
   # project resolves the same way on every machine and on every day.
   # Gemfile.lock pins what these depend on.
   gem "rails", "8.1.4"
   gem "propshaft", "1.3.2"
   gem "sqlite3", "2.9.6"
   gem "puma", "8.0.2"
   gem "importmap-rails", "2.2.3"
   gem "turbo-rails", "2.0.23"
   gem "stimulus-rails", "1.3.4"

   # has_secure_password, used by the authentication generator.
   gem "bcrypt", "3.1.22"

   # Windows does not include zoneinfo files, so bundle the tzinfo-data gem.
   gem "tzinfo-data", "1.2026.4", platforms: %i[ windows jruby ]

   # The database-backed adapters for Rails.cache, Active Job and Action Cable.
   gem "solid_cache", "1.0.10"
   gem "solid_queue", "1.7.0"
   gem "solid_cable", "4.0.2"

   gem "bootsnap", "1.26.0", require: false
   gem "thruster", "0.1.26", require: false

   group :development, :test do
     gem "debug", "1.11.1", platforms: %i[ mri windows ], require: "debug/prelude"
     gem "bundler-audit", "0.9.3", require: false
     gem "brakeman", "8.0.6", require: false
     gem "rubocop", "1.91.0", require: false
     gem "rubocop-rails-omakase", "1.1.0", require: false
   end

   group :development do
     gem "web-console", "4.3.0"
   end
   ```

   Verify: `grep -q 'gem "brakeman", "8.0.6"' Gemfile`

4. Resolve the pinned gems and rewrite `Gemfile.lock` from them: `bundle install`
   Verify: `test "$(bundle exec brakeman --version)" = "brakeman 8.0.6"`

5. Generate authentication: a `User` with `has_secure_password`, database-backed sessions, sign-in, sign-out, password reset, and the tests for them: `bin/rails generate authentication`
   Verify: `test -f app/controllers/concerns/authentication.rb`

6. Replace `app/models/user.rb` with a model that refuses a short password:

   ```ruby
   class User < ApplicationRecord
     has_secure_password
     has_many :sessions, dependent: :destroy

     # has_secure_password caps a password at 72 bytes and sets no minimum.
     # OWASP ASVS 5.0 (6.2.1) requires at least 8 and strongly recommends 15.
     # allow_nil, because an update that does not touch the password must not
     # fail on it; has_secure_password already requires one on create.
     validates :password, length: { minimum: 15 }, allow_nil: true

     normalizes :email_address, with: ->(e) { e.strip.downcase }
   end
   ```

   Verify: `grep -q "minimum: 15" app/models/user.rb`

7. Replace `app/models/session.rb` with a session that has an absolute lifetime:

   ```ruby
   class Session < ApplicationRecord
     # How long a sign-in lasts, however recently it was used. The generated
     # code keeps a session until sign-out, behind a cookie that expires in
     # twenty years. Authentication refuses a session older than this, and
     # PurgeExpiredSessionsJob deletes the rows. Thirty days is a starting
     # point; choose yours and write down why (OWASP ASVS 5.0, 7.1.1 and 7.3.2).
     MAX_AGE = 30.days

     belongs_to :user

     scope :active, -> { where(created_at: MAX_AGE.ago..) }
     scope :expired, -> { where(created_at: ...MAX_AGE.ago) }
   end
   ```

   Verify: `grep -q "MAX_AGE = 30.days" app/models/session.rb`

8. Replace `app/controllers/concerns/authentication.rb` so that an expired session is refused and the cookie expires with it:

   ```ruby
   module Authentication
     extend ActiveSupport::Concern

     included do
       before_action :require_authentication
       helper_method :authenticated?
     end

     class_methods do
       def allow_unauthenticated_access(**options)
         skip_before_action :require_authentication, **options
       end
     end

     private
       def authenticated?
         resume_session
       end

       def require_authentication
         resume_session || request_authentication
       end

       def resume_session
         Current.session ||= find_session_by_cookie
       end

       # Session.active rather than Session: an expired session is refused
       # here even before the purge job has deleted it.
       def find_session_by_cookie
         Session.active.find_by(id: cookies.signed[:session_id]) if cookies.signed[:session_id]
       end

       def request_authentication
         session[:return_to_after_authenticating] = request.url
         redirect_to new_session_path
       end

       def after_authentication_url
         session.delete(:return_to_after_authenticating) || root_url
       end

       def start_new_session_for(user)
         user.sessions.create!(user_agent: request.user_agent, ip_address: request.remote_ip).tap do |session|
           Current.session = session
           cookies.signed[:session_id] = { value: session.id, httponly: true, same_site: :lax, expires: Session::MAX_AGE.from_now }
         end
       end

       def terminate_session
         Current.session.destroy
         cookies.delete(:session_id)
       end
   end
   ```

   Verify: `grep -q "Session.active.find_by" app/controllers/concerns/authentication.rb`

9. Replace `app/channels/application_cable/connection.rb` so that a WebSocket connection applies the same lifetime:

   ```ruby
   module ApplicationCable
     class Connection < ActionCable::Connection::Base
       identified_by :current_user

       def connect
         set_current_user || reject_unauthorized_connection
       end

       private
         # The same lookup as Authentication#find_session_by_cookie, so an
         # expired session cannot open a connection either.
         def set_current_user
           if session = Session.active.find_by(id: cookies.signed[:session_id])
             self.current_user = session.user
           end
         end
     end
   end
   ```

   Verify: `grep -q "Session.active.find_by" app/channels/application_cable/connection.rb`

10. Create `app/controllers/dashboard_controller.rb`, the page behind sign-in:

    ```ruby
    # It says nothing about authentication, and that is the point:
    # ApplicationController includes Authentication, so every action requires a
    # session unless its controller opts out with allow_unauthenticated_access.
    class DashboardController < ApplicationController
      def show
      end
    end
    ```

    Verify: `test -f app/controllers/dashboard_controller.rb`

11. Create `app/views/dashboard/show.html.erb` with:

    ```erb
    <h1>Signed in as <%= Current.user.email_address %></h1>

    <%= button_to "Sign out", session_path, method: :delete %>
    ```

    Verify: `test -f app/views/dashboard/show.html.erb`

12. Replace `config/routes.rb` with the authentication routes, the health check and the protected root:

    ```ruby
    Rails.application.routes.draw do
      resource :session
      resources :passwords, param: :token

      # 200 when the application boots, 500 when it does not. It touches no
      # session and no database, so a load balancer can call it unauthenticated.
      get "up" => "rails/health#show", as: :rails_health_check

      # Behind sign-in, like every route above except sign-in, password reset
      # and /up.
      root "dashboard#show"
    end
    ```

    Verify: `grep -q 'root "dashboard#show"' config/routes.rb`

13. Create `app/jobs/purge_expired_sessions_job.rb` with:

    ```ruby
    # Deletes the sessions Authentication already refuses. Not a security
    # control on its own (the lookup is), but without it the sessions table
    # grows by one row per sign-in, forever.
    class PurgeExpiredSessionsJob < ApplicationJob
      queue_as :default

      def perform
        Session.expired.delete_all
      end
    end
    ```

    Verify: `test -f app/jobs/purge_expired_sessions_job.rb`

14. Replace `config/recurring.yml` with the schedule Solid Queue runs in production:

    ```yaml
    # Run by the Solid Queue supervisor in production: bin/jobs as its own
    # process, or inside Puma when SOLID_QUEUE_IN_PUMA is set. Without one of
    # them nothing here runs, and nothing says so.

    production:
      clear_solid_queue_finished_jobs:
        command: 'SolidQueue::Job.clear_finished_in_batches(sleep_between_batches: 0.3)'
        schedule: every hour at minute 12
      purge_expired_sessions:
        class: PurgeExpiredSessionsJob
        queue: default
        schedule: every day at 4am
    ```

    Verify: `bin/rails runner 'exit(Fugit.parse(YAML.load_file("config/recurring.yml").dig("production", "purge_expired_sessions", "schedule")).is_a?(Fugit::Cron))'`

15. Replace `test/models/user_test.rb` with the generated test and the password floor:

    ```ruby
    require "test_helper"

    class UserTest < ActiveSupport::TestCase
      test "downcases and strips email_address" do
        user = User.new(email_address: " DOWNCASED@EXAMPLE.COM ")
        assert_equal("downcased@example.com", user.email_address)
      end

      test "refuses a password shorter than fifteen characters" do
        user = User.new(email_address: "short@example.com", password: "fourteen-chars")
        assert_not user.valid?
        assert_includes user.errors[:password], "is too short (minimum is 15 characters)"
      end

      test "accepts a password of fifteen characters" do
        user = User.new(email_address: "long@example.com", password: "fifteen-chars-x")
        assert user.valid?
      end
    end
    ```

    Verify: `test -f test/models/user_test.rb`

16. Replace `test/controllers/passwords_controller_test.rb` with the generated tests, using passwords the new floor accepts, and one it refuses:

    ```ruby
    require "test_helper"

    class PasswordsControllerTest < ActionDispatch::IntegrationTest
      setup { @user = User.take }

      test "new" do
        get new_password_path
        assert_response :success
      end

      test "create" do
        post passwords_path, params: { email_address: @user.email_address }
        assert_enqueued_email_with PasswordsMailer, :reset, args: [ @user ]
        assert_redirected_to new_session_path

        follow_redirect!
        assert_notice "reset instructions sent"
      end

      test "create for an unknown user redirects but sends no mail" do
        post passwords_path, params: { email_address: "missing-user@example.com" }
        assert_enqueued_emails 0
        assert_redirected_to new_session_path

        follow_redirect!
        assert_notice "reset instructions sent"
      end

      test "edit" do
        get edit_password_path(@user.password_reset_token)
        assert_response :success
      end

      test "edit with invalid password reset token" do
        get edit_password_path("invalid token")
        assert_redirected_to new_password_path

        follow_redirect!
        assert_notice "reset link is invalid"
      end

      test "update" do
        assert_changes -> { @user.reload.password_digest } do
          put password_path(@user.password_reset_token), params: { password: "correct-horse-battery", password_confirmation: "correct-horse-battery" }
          assert_redirected_to new_session_path
        end

        follow_redirect!
        assert_notice "Password has been reset"
      end

      test "update with non matching passwords" do
        token = @user.password_reset_token
        assert_no_changes -> { @user.reload.password_digest } do
          put password_path(token), params: { password: "first-long-password", password_confirmation: "second-long-password" }
          assert_redirected_to edit_password_path(token)
        end

        follow_redirect!
        assert_notice "Passwords did not match"
      end

      test "update with a password that is too short" do
        token = @user.password_reset_token
        assert_no_changes -> { @user.reload.password_digest } do
          put password_path(token), params: { password: "short", password_confirmation: "short" }
          assert_redirected_to edit_password_path(token)
        end
      end

      private
        def assert_notice(text)
          assert_select "div", /#{text}/
        end
    end
    ```

    Verify: `test -f test/controllers/passwords_controller_test.rb`

17. Create `test/controllers/dashboard_controller_test.rb`, the test that proves the page is protected:

    ```ruby
    require "test_helper"

    class DashboardControllerTest < ActionDispatch::IntegrationTest
      test "redirects to sign-in without a session" do
        get root_path
        assert_redirected_to new_session_path
      end

      test "shows the page to a signed-in user" do
        sign_in_as users(:one)
        get root_path
        assert_response :success
        assert_select "h1", /one@example\.com/
      end

      test "refuses a session older than the maximum age" do
        sign_in_as users(:one)
        Current.session.update!(created_at: (Session::MAX_AGE + 1.day).ago)
        # Forget the session sign_in_as put in Current, so the request has to
        # find it from the cookie, which is the path a browser takes.
        Current.reset

        get root_path
        assert_redirected_to new_session_path
      end
    end
    ```

    Verify: `test -f test/controllers/dashboard_controller_test.rb`

18. Create `test/jobs/purge_expired_sessions_job_test.rb` with:

    ```ruby
    require "test_helper"

    class PurgeExpiredSessionsJobTest < ActiveJob::TestCase
      test "deletes expired sessions and keeps active ones" do
        user = users(:one)
        expired = user.sessions.create!(created_at: (Session::MAX_AGE + 1.day).ago)
        active = user.sessions.create!

        perform_enqueued_jobs do
          PurgeExpiredSessionsJob.perform_later
        end

        assert_not Session.exists?(expired.id)
        assert Session.exists?(active.id)
      end

      test "is enqueued on the queue the recurring schedule names" do
        assert_enqueued_with(job: PurgeExpiredSessionsJob, queue: "default") do
          PurgeExpiredSessionsJob.perform_later
        end
      end
    end
    ```

    Verify: `test -f test/jobs/purge_expired_sessions_job_test.rb`

19. Replace the generated `.github/workflows/ci.yml` with the same four jobs, the actions pinned by commit and the token read-only:

    ```yaml
    name: CI

    on:
      pull_request:
      push:
        branches: [main]

    # No job here writes to the repository.
    permissions:
      contents: read

    jobs:
      scan_ruby:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          - name: Set up Ruby
            uses: ruby/setup-ruby@762794c140bbeda0f1224786aa33b4b46783a6c1 # v1.326.0
            with:
              bundler-cache: true

          - name: Scan for common Rails security vulnerabilities using static analysis
            run: bin/brakeman --no-pager --quiet --exit-on-warn --exit-on-error

          - name: Scan for known security vulnerabilities in gems used
            run: bin/bundler-audit

      scan_js:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          - name: Set up Ruby
            uses: ruby/setup-ruby@762794c140bbeda0f1224786aa33b4b46783a6c1 # v1.326.0
            with:
              bundler-cache: true

          - name: Scan for security vulnerabilities in JavaScript dependencies
            run: bin/importmap audit

      lint:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          - name: Set up Ruby
            uses: ruby/setup-ruby@762794c140bbeda0f1224786aa33b4b46783a6c1 # v1.326.0
            with:
              bundler-cache: true

          - name: Lint code for consistent style
            run: bin/rubocop -f github

      test:
        runs-on: ubuntu-latest
        steps:
          - name: Checkout code
            uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          - name: Set up Ruby
            uses: ruby/setup-ruby@762794c140bbeda0f1224786aa33b4b46783a6c1 # v1.326.0
            with:
              bundler-cache: true

          - name: Run tests
            env:
              RAILS_ENV: test
            run: bin/rails db:test:prepare test
    ```

    Verify: `ruby -ryaml -e 'exit(YAML.load_file(".github/workflows/ci.yml")["jobs"].keys.sort == %w[lint scan_js scan_ruby test])'`

20. Create the development database and the schema file the tests load: `bin/rails db:migrate`
    Verify: `grep -q 'create_table "sessions"' db/schema.rb`

21. Run the test suite: `bin/rails test`
    Verify: `bin/rails test test/controllers/dashboard_controller_test.rb test/jobs/purge_expired_sessions_job_test.rb`

22. Check the style against the Rails omakase rules: `bin/rubocop`
    Verify: `bin/rubocop --list-target-files | grep -q "app/jobs/purge_expired_sessions_job.rb"`

23. Scan for security problems with Brakeman, failing on any warning: `bin/brakeman --no-pager --quiet --exit-on-warn --exit-on-error`
    Verify: `bin/brakeman --no-pager --quiet --format json | ruby -rjson -e 'exit(JSON.parse($stdin.read)["warnings"].empty?)'`

24. Confirm that the key which decrypts the credentials file is ignored by Git, so it is never committed: `git check-ignore --quiet config/master.key`
    Verify: `grep -qx "/config/master.key" .dockerignore`

25. Build the container image the generator wrote: `docker build --tag rails-web-app-check:dev .`
    Verify: `test "$(docker image inspect --format '{{.Config.User}}' rails-web-app-check:dev)" = "1000:1000"`

26. Confirm that the image carries the encrypted credentials but not the key that opens them: `docker run --rm rails-web-app-check:dev test ! -e config/master.key`
    Verify: `docker run --rm rails-web-app-check:dev test -f config/credentials.yml.enc`

27. Remove a check container left behind by an earlier attempt: `docker rm --force rails-web-app-check > /dev/null 2>&1 || true`
    Verify: `test -z "$(docker ps --all --filter name=rails-web-app-check --quiet)"`

28. Start the image in production mode on a port the operating system chooses. The secret key base is generated for this check and never printed, and the job supervisor runs inside the web server, so the check also proves the queue database is prepared. The retry is not politeness: the entrypoint prepares four SQLite databases before the server listens: `docker run --detach --name rails-web-app-check --env SECRET_KEY_BASE="$(ruby -rsecurerandom -e 'print SecureRandom.hex(64)')" --env SOLID_QUEUE_IN_PUMA=1 --publish 127.0.0.1::80 rails-web-app-check:dev`
    Verify: `curl -fsS --retry 60 --retry-delay 1 --retry-all-errors "http://$(docker port rails-web-app-check 80)/up"`

29. Ask the running container for the protected page without a session, and record the status it answers with: `curl -s -o /dev/null -w "%{http_code}" "http://$(docker port rails-web-app-check 80)/" > tmp/root-status.txt`
    Verify: `test "$(cat tmp/root-status.txt)" = "302"`

30. Stop the check container: `docker rm --force rails-web-app-check`
    Verify: `test -z "$(docker ps --all --filter name=rails-web-app-check --quiet)"`
