# Setup

Creates a Flutter app for iOS, Android and the web: one list screen and one
detail screen, state in a Riverpod `Notifier`, navigation through `go_router`
with the location built from a typed route object, the app's rules in plain
Dart with no framework import, 36 tests including the accessibility guideline
matchers, `dart format` and `flutter analyze` as gates, and a release web
build as the proof that the whole thing compiles.

Run every step from the empty directory that will hold the project. Each step
is one action and ends with the command that proves it worked. Stop at the
first verification that fails.

Requires Flutter 3.47.5 or newer on `PATH`, which brings Dart 3.13.4 with it.
Nothing needs a device, an emulator, Xcode, the Android SDK or an account: the
tests run on the Dart VM and the build proof targets the web. Everything else
is downloaded from `pub.dev`.

1. Scaffold the project. `--empty` leaves out the counter sample, so nothing written below has to be deleted first: `flutter create --project-name tasks --org com.example --platforms android,ios,web --empty .`
   Verify: `test -f lib/main.dart`

2. Replace `pubspec.yaml` with:

   ```yaml
   name: tasks
   description: 'A Flutter task list, scaffolded from the flutter-mobile-app blueprint.'
   publish_to: 'none'
   version: 0.1.0+1

   environment:
     # The Dart version Flutter 3.47.5 ships. `flutter create` writes this
     # line from the installed SDK; it is repeated here because this file is
     # written whole rather than edited.
     sdk: ^3.13.4

   dependencies:
     flutter:
       sdk: flutter
     flutter_localizations:
       sdk: flutter
     # Exact versions, no `^`. A caret on a state library or a router is how a
     # build that passed yesterday fails today for a reason nobody changed.
     # Each was read from pub.dev on 2026-09-30.
     flutter_riverpod: 3.4.3
     go_router: 18.0.2
     # Pinned to what flutter_localizations depends on; the generated
     # localisations import it.
     intl: 0.20.3

   dev_dependencies:
     flutter_test:
       sdk: flutter
     very_good_analysis: 11.0.0

   flutter:
     # Generate the localisations from the ARB files on `flutter pub get`.
     generate: true
     uses-material-design: true
   ```

   Verify: `grep -q "go_router: 18.0.2" pubspec.yaml`

3. Create the localisation configuration, which is what makes the generator read the ARB files below, at `l10n.yaml`:

   ```yaml
   # The generated Dart lands next to the ARB files, in the project's own lib
   # folder, and is committed. Flutter's old synthetic package is gone, so
   # generated localisations are ordinary source: analysable, greppable, and
   # visible in a diff when a string changes.
   arb-dir: lib/l10n
   template-arb-file: app_en.arb
   output-dir: lib/l10n
   output-localization-file: app_localizations.dart
   # `AppLocalizations.of(context)` returns non-null, so no screen has to
   # decide what to do when the delegate is missing.
   nullable-getter: false
   format: true
   ```

   Verify: `grep -q "arb-dir: lib/l10n" l10n.yaml`

4. Create `lib/l10n/app_en.arb`, the one place a user-facing string is written:

   ```json
   {
     "@@locale": "en",
     "appTitle": "Tasks",
     "@appTitle": {
       "description": "The application name, shown in the app bar and the task switcher."
     },
     "newTaskLabel": "New task",
     "@newTaskLabel": {
       "description": "Label of the text field a new task title is typed into."
     },
     "addTask": "Add task",
     "@addTask": {
       "description": "Label of the button that adds the typed title to the list."
     },
     "titleBlank": "A task needs a title.",
     "@titleBlank": {
       "description": "Error shown when the typed title is empty or only spaces."
     },
     "titleTooLong": "A title is at most {max} characters.",
     "@titleTooLong": {
       "description": "Error shown when the typed title is longer than the limit.",
       "placeholders": {
         "max": {
           "type": "int"
         }
       }
     },
     "remaining": "Remaining: {count}",
     "@remaining": {
       "description": "How many tasks on the list are still not done.",
       "placeholders": {
         "count": {
           "type": "int"
         }
       }
     },
     "openTask": "Open task",
     "@openTask": {
       "description": "Tooltip of the button that opens one task's own screen."
     },
     "taskDone": "Done",
     "@taskDone": {
       "description": "Label of the state shown on a task's own screen."
     },
     "taskNotDone": "Not done",
     "@taskNotDone": {
       "description": "Label of the state shown on a task's own screen."
     },
     "taskMissing": "That task does not exist.",
     "@taskMissing": {
       "description": "Shown when a link names a task id the list does not hold."
     },
     "pageMissing": "That page does not exist.",
     "@pageMissing": {
       "description": "Shown when a link names a location the router cannot match."
     },
     "backToList": "Back to the task list",
     "@backToList": {
       "description": "Label of the button that returns to the list of tasks."
     }
   }
   ```

   Verify: `grep -q '"appTitle": "Tasks"' lib/l10n/app_en.arb`

5. Resolve the dependencies. This writes `pubspec.lock`, which is committed: it is what makes two machines install the same versions: `flutter pub get`
   Verify: `grep -q "^  go_router:" pubspec.lock`

6. Generate the localisations from the ARB file: `flutter gen-l10n`
   Verify: `grep -q "class AppLocalizations" lib/l10n/app_localizations.dart`

7. Replace `analysis_options.yaml` with:

   ```yaml
   # very_good_analysis is pinned to the exact version, not `^`: a lint set that
   # moves on its own turns an unrelated dependency update into a red build.
   # It is the stricter of the two common sets — flutter_lints 6.0.0 does not
   # enable prefer_const_constructors, unawaited_futures or discarded_futures,
   # and this one enables all three, plus strict-casts, strict-inference and
   # strict-raw-types.
   include: package:very_good_analysis/analysis_options.11.0.0.yaml

   analyzer:
     exclude:
       - build/**
       - android/**
       - ios/**
       - web/**
     errors:
       # Both are already errors by default; naming them here means a future
       # change to the included set cannot quietly demote them.
       missing_required_param: error
       missing_return: error
   ```

   Verify: `grep -q "very_good_analysis/analysis_options.11.0.0.yaml" analysis_options.yaml`

8. Create `lib/src/rules/task.dart`, the first of the two files that hold the app's rules:

   ```dart
   /// One task on the list.
   ///
   /// Plain Dart on purpose: nothing in `lib/src/rules` may import Flutter, so
   /// every rule here is testable without pumping a widget.
   /// `test/rules/rules_are_flutter_free_test.dart` is what keeps it that way.
   class Task {
     /// Creates a task. [id] is unique within one list and never reused.
     const new({required this.id, required this.title, this.done = false});

     /// Identifies the task in a link such as `/tasks/3`.
     final int id;

     /// What the task says, already trimmed by `normalizeTitle`.
     final String title;

     /// Whether the task has been finished.
     final bool done;

     /// The same task with [done] flipped.
     Task toggled() => Task(id: id, title: title, done: !done);
   }
   ```

   Verify: `grep -q "class Task {" lib/src/rules/task.dart`

9. Create `lib/src/rules/task_rules.dart`:

   ```dart
   import 'package:tasks/src/rules/task.dart';

   /// The longest title the app stores.
   const int maxTitleLength = 80;

   /// Why a typed title was refused.
   enum TitleProblem {
     /// Nothing was typed, or only whitespace was.
     blank,

     /// The trimmed title is longer than [maxTitleLength].
     tooLong,
   }

   /// What is wrong with [raw] as a title, or `null` when it can be stored.
   TitleProblem? checkTitle(String raw) {
     final trimmed = raw.trim();
     if (trimmed.isEmpty) return TitleProblem.blank;
     if (trimmed.length > maxTitleLength) return TitleProblem.tooLong;
     return null;
   }

   /// The form of [raw] that is stored: the surrounding whitespace removed.
   String normalizeTitle(String raw) => raw.trim();

   /// How many of [tasks] are still not done.
   int remainingCount(Iterable<Task> tasks) =>
       tasks.where((task) => !task.done).length;

   /// The task in [tasks] with this [id], or `null` when the list holds none.
   ///
   /// A link is input: `/tasks/9999` is a request for a task that may never have
   /// existed, and the caller has to be able to say so rather than throw.
   Task? findTask(Iterable<Task> tasks, int id) {
     for (final task in tasks) {
       if (task.id == id) return task;
     }
     return null;
   }
   ```

   Verify: `grep -q "TitleProblem? checkTitle" lib/src/rules/task_rules.dart`

10. Create `lib/src/state/tasks_notifier.dart`, the only thing allowed to change the list:

    ```dart
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:tasks/src/rules/task.dart';
    import 'package:tasks/src/rules/task_rules.dart';

    /// The task list, and the only thing allowed to change it.
    final tasksProvider = NotifierProvider<TasksNotifier, List<Task>>(
      TasksNotifier.new,
    );

    /// Holds the list. Every decision it makes comes from `lib/src/rules`; this
    /// class applies them and owns the identifiers, nothing else.
    class TasksNotifier extends Notifier<List<Task>> {
      int _nextId = 1;

      @override
      List<Task> build() => const [];

      /// Adds [rawTitle] to the list.
      ///
      /// Returns the reason it was refused, or `null` when it was added. The
      /// caller decides how to show the reason; the notifier does not know about
      /// widgets or about which language the user reads.
      TitleProblem? add(String rawTitle) {
        final problem = checkTitle(rawTitle);
        if (problem != null) return problem;
        final task = Task(id: _nextId, title: normalizeTitle(rawTitle));
        _nextId += 1;
        state = [...state, task];
        return null;
      }

      /// Flips whether the task with this [id] is done. An unknown id is ignored.
      void toggle(int id) {
        state = [
          for (final task in state)
            if (task.id == id) task.toggled() else task,
        ];
      }
    }
    ```

    Verify: `grep -q "class TasksNotifier extends Notifier" lib/src/state/tasks_notifier.dart`

11. Create `lib/src/routing/routes.dart`, where every location in the app is spelled:

    ```dart
    import 'package:go_router/go_router.dart';

    /// The list of tasks.
    ///
    /// Routes are objects rather than strings so that a location is spelled once.
    /// A `context.go('/taksk/1')` typo compiles; `TaskDetailRoute(1).location`
    /// cannot be misspelled, and renaming a path is one edit in this file.
    class TaskListRoute {
      /// Creates the route to the list.
      const new();

      /// The pattern `GoRouter` matches on.
      static const String path = '/';

      /// Where to send `context.go`.
      String get location => path;
    }

    /// One task, addressed by its id.
    class TaskDetailRoute {
      /// Creates the route to the task with this [id].
      const new(this.id);

      /// The pattern `GoRouter` matches on, with its one path parameter.
      static const String path = '/tasks/:id';

      /// The task this route names.
      final int id;

      /// Where to send `context.go`.
      String get location => '/tasks/$id';
    }

    /// Reads a [TaskDetailRoute] out of [state], or `null` when the link is not
    /// one this app can serve.
    ///
    /// Every route parameter is input from outside the app: a deep link, a
    /// browser address bar, another app. `/tasks/abc` and `/tasks/-1` arrive
    /// here, and `int.parse` on either would throw during a build.
    TaskDetailRoute? parseTaskDetailRoute(GoRouterState state) {
      final raw = state.pathParameters['id'];
      if (raw == null) return null;
      final id = int.tryParse(raw);
      if (id == null || id < 1) return null;
      return TaskDetailRoute(id);
    }
    ```

    Verify: `grep -q "TaskDetailRoute? parseTaskDetailRoute" lib/src/routing/routes.dart`

12. Create `lib/src/ui/task_list_screen.dart`:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:go_router/go_router.dart';
    import 'package:tasks/l10n/app_localizations.dart';
    import 'package:tasks/src/routing/routes.dart';
    import 'package:tasks/src/rules/task.dart';
    import 'package:tasks/src/rules/task_rules.dart';
    import 'package:tasks/src/state/tasks_notifier.dart';

    /// The list of tasks, and the field that adds one.
    class TaskListScreen extends ConsumerStatefulWidget {
      /// Creates the screen.
      const new({super.key});

      @override
      ConsumerState<TaskListScreen> createState() => _TaskListScreenState();
    }

    class _TaskListScreenState extends ConsumerState<TaskListScreen> {
      final TextEditingController _controller = TextEditingController();
      TitleProblem? _problem;

      @override
      void dispose() {
        _controller.dispose();
        super.dispose();
      }

      void _add() {
        final problem = ref.read(tasksProvider.notifier).add(_controller.text);
        setState(() => _problem = problem);
        if (problem == null) _controller.clear();
      }

      String? _errorText(AppLocalizations l10n) => switch (_problem) {
        null => null,
        TitleProblem.blank => l10n.titleBlank,
        TitleProblem.tooLong => l10n.titleTooLong(maxTitleLength),
      };

      @override
      Widget build(BuildContext context) {
        final l10n = AppLocalizations.of(context);
        final tasks = ref.watch(tasksProvider);
        return Scaffold(
          appBar: AppBar(title: Text(l10n.appTitle)),
          body: Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    TextField(
                      controller: _controller,
                      onSubmitted: (_) => _add(),
                      decoration: InputDecoration(
                        labelText: l10n.newTaskLabel,
                        errorText: _errorText(l10n),
                        border: const OutlineInputBorder(),
                      ),
                    ),
                    const SizedBox(height: 12),
                    ElevatedButton(onPressed: _add, child: Text(l10n.addTask)),
                    const SizedBox(height: 12),
                    Text(l10n.remaining(remainingCount(tasks))),
                  ],
                ),
              ),
              Expanded(
                child: ListView.builder(
                  itemCount: tasks.length,
                  itemBuilder: (context, index) {
                    final task = tasks[index];
                    return _TaskRow(
                      task: task,
                      onToggle: () =>
                          ref.read(tasksProvider.notifier).toggle(task.id),
                    );
                  },
                ),
              ),
            ],
          ),
        );
      }
    }

    /// One row: a widget class rather than a `_buildRow` method, so that it has
    /// an element of its own and rebuilds only when its own task changes.
    class _TaskRow extends StatelessWidget {
      const new({required this.task, required this.onToggle});

      final Task task;
      final VoidCallback onToggle;

      @override
      Widget build(BuildContext context) {
        final l10n = AppLocalizations.of(context);
        return CheckboxListTile(
          value: task.done,
          onChanged: (_) => onToggle(),
          controlAffinity: ListTileControlAffinity.leading,
          title: Text(task.title),
          secondary: IconButton(
            icon: const Icon(Icons.chevron_right),
            tooltip: l10n.openTask,
            onPressed: () => context.go(TaskDetailRoute(task.id).location),
          ),
        );
      }
    }
    ```

    Verify: `grep -q "class TaskListScreen" lib/src/ui/task_list_screen.dart`

13. Create `lib/src/ui/task_detail_screen.dart`:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:go_router/go_router.dart';
    import 'package:tasks/l10n/app_localizations.dart';
    import 'package:tasks/src/routing/routes.dart';
    import 'package:tasks/src/rules/task_rules.dart';
    import 'package:tasks/src/state/tasks_notifier.dart';

    /// One task, reached by a link such as `/tasks/3`.
    class TaskDetailScreen extends ConsumerWidget {
      /// Creates the screen for the task with this [taskId].
      const new({required this.taskId, super.key});

      /// The id parsed out of the link, already known to be a positive integer.
      final int taskId;

      @override
      Widget build(BuildContext context, WidgetRef ref) {
        final l10n = AppLocalizations.of(context);
        // A well-formed id is still an id the list may not hold: the link can be
        // older than the list, or come from somewhere else entirely.
        final task = findTask(ref.watch(tasksProvider), taskId);
        return Scaffold(
          appBar: AppBar(title: Text(l10n.appTitle)),
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(task == null ? l10n.taskMissing : task.title),
                const SizedBox(height: 8),
                if (task != null)
                  Text(task.done ? l10n.taskDone : l10n.taskNotDone),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => context.go(const TaskListRoute().location),
                  child: Text(l10n.backToList),
                ),
              ],
            ),
          ),
        );
      }
    }
    ```

    Verify: `grep -q "class TaskDetailScreen" lib/src/ui/task_detail_screen.dart`

14. Create `lib/src/ui/missing_screen.dart`, the app's error path for a link it cannot serve:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:go_router/go_router.dart';
    import 'package:tasks/l10n/app_localizations.dart';
    import 'package:tasks/src/routing/routes.dart';

    /// Where a link the app cannot serve ends up.
    ///
    /// A deep link is input, so this is the app's error path, not a placeholder:
    /// it says what happened and offers the one way back.
    class MissingScreen extends StatelessWidget {
      /// Creates the screen.
      const new({super.key});

      @override
      Widget build(BuildContext context) {
        final l10n = AppLocalizations.of(context);
        return Scaffold(
          appBar: AppBar(title: Text(l10n.appTitle)),
          body: Center(
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(l10n.pageMissing),
                const SizedBox(height: 12),
                ElevatedButton(
                  onPressed: () => context.go(const TaskListRoute().location),
                  child: Text(l10n.backToList),
                ),
              ],
            ),
          ),
        );
      }
    }
    ```

    Verify: `grep -q "class MissingScreen" lib/src/ui/missing_screen.dart`

15. Create `lib/src/routing/router.dart`:

    ```dart
    import 'package:go_router/go_router.dart';
    import 'package:tasks/src/routing/routes.dart';
    import 'package:tasks/src/ui/missing_screen.dart';
    import 'package:tasks/src/ui/task_detail_screen.dart';
    import 'package:tasks/src/ui/task_list_screen.dart';

    /// Builds the router.
    ///
    /// A new one per call: a `GoRouter` owns navigation history, so a test that
    /// reused one would start where the previous test finished. [initialLocation]
    /// is how a test opens a deep link without tapping its way there.
    GoRouter buildRouter({String initialLocation = TaskListRoute.path}) {
      return GoRouter(
        initialLocation: initialLocation,
        // Anything the routes below do not match — a stale link, a typo, a
        // location from another version of the app — lands here rather than on
        // the framework's red error page.
        errorBuilder: (context, state) => const MissingScreen(),
        routes: [
          GoRoute(
            path: TaskListRoute.path,
            builder: (context, state) => const TaskListScreen(),
          ),
          GoRoute(
            path: TaskDetailRoute.path,
            builder: (context, state) {
              final route = parseTaskDetailRoute(state);
              if (route == null) return const MissingScreen();
              return TaskDetailScreen(taskId: route.id);
            },
          ),
        ],
      );
    }
    ```

    Verify: `grep -q "errorBuilder:" lib/src/routing/router.dart`

16. Create `lib/src/app.dart`:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:go_router/go_router.dart';
    import 'package:tasks/l10n/app_localizations.dart';
    import 'package:tasks/src/routing/router.dart';

    /// The application: theme, localisations and the router.
    ///
    /// Stateful only to hold the router, which must outlive a rebuild; nothing
    /// else here keeps state.
    class TasksApp extends StatefulWidget {
      /// Creates the application widget.
      const new({super.key, this.initialLocation});

      /// Where the app opens, when a test wants somewhere other than the list.
      final String? initialLocation;

      @override
      State<TasksApp> createState() => _TasksAppState();
    }

    class _TasksAppState extends State<TasksApp> {
      late final GoRouter _router = widget.initialLocation == null
          ? buildRouter()
          : buildRouter(initialLocation: widget.initialLocation!);

      @override
      Widget build(BuildContext context) {
        return MaterialApp.router(
          onGenerateTitle: (context) => AppLocalizations.of(context).appTitle,
          localizationsDelegates: AppLocalizations.localizationsDelegates,
          supportedLocales: AppLocalizations.supportedLocales,
          theme: buildTheme(),
          routerConfig: _router,
        );
      }
    }

    /// The theme.
    ///
    /// The one thing here that is not decoration: a button is 48 logical pixels
    /// tall. Material 3 ships 40, which is below the 48 by 48 target Android's
    /// accessibility guidance asks for, and `androidTapTargetGuideline` in the
    /// widget tests fails the build when a control is smaller.
    ThemeData buildTheme() {
      return ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF3F51B5)),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(minimumSize: const Size(64, 48)),
        ),
        textButtonTheme: TextButtonThemeData(
          style: TextButton.styleFrom(minimumSize: const Size(64, 48)),
        ),
      );
    }
    ```

    Verify: `grep -q "MaterialApp.router" lib/src/app.dart`

17. Replace `lib/main.dart` with:

    ```dart
    import 'package:flutter/widgets.dart';
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:tasks/src/app.dart';

    /// Starts the app inside the one [ProviderScope] every provider is read from.
    void main() {
      runApp(const ProviderScope(child: TasksApp()));
    }
    ```

    Verify: `grep -q "ProviderScope(child: TasksApp())" lib/main.dart`

18. Create `test/app_harness.dart`, the two helpers every widget test below uses:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:flutter_test/flutter_test.dart';
    import 'package:tasks/src/app.dart';

    /// Pumps the whole app, router and localisations included.
    ///
    /// The tests drive the real screens rather than a widget wrapped in a
    /// `MaterialApp` of their own, because the wiring — the router, the provider
    /// scope, the delegates — is most of what can break.
    Future<void> pumpApp(WidgetTester tester, {String? initialLocation}) async {
      await tester.pumpWidget(
        ProviderScope(child: TasksApp(initialLocation: initialLocation)),
      );
      await tester.pumpAndSettle();
    }

    /// Types [title] into the field and presses the button that adds it.
    Future<void> addTask(WidgetTester tester, String title) async {
      await tester.enterText(find.byType(TextField), title);
      await tester.tap(find.widgetWithText(ElevatedButton, 'Add task'));
      await tester.pumpAndSettle();
    }
    ```

    Verify: `grep -q "Future<void> pumpApp" test/app_harness.dart`

19. Create `test/rules/task_rules_test.dart`:

    ```dart
    import 'package:flutter_test/flutter_test.dart';
    import 'package:tasks/src/rules/task.dart';
    import 'package:tasks/src/rules/task_rules.dart';

    void main() {
      group('checkTitle', () {
        test('refuses nothing typed', () {
          expect(checkTitle(''), TitleProblem.blank);
        });

        test('refuses whitespace only', () {
          expect(checkTitle('   \t\n '), TitleProblem.blank);
        });

        test('accepts a title of exactly the limit', () {
          expect(checkTitle('a' * maxTitleLength), isNull);
        });

        test('refuses one character past the limit', () {
          expect(checkTitle('a' * (maxTitleLength + 1)), TitleProblem.tooLong);
        });

        test('measures the trimmed title, not what was typed', () {
          expect(checkTitle('  ${'a' * maxTitleLength}  '), isNull);
        });
      });

      group('normalizeTitle', () {
        test('drops the whitespace around the title', () {
          expect(normalizeTitle('  buy milk \n'), 'buy milk');
        });

        test('leaves the inside of the title alone', () {
          expect(normalizeTitle('buy  milk'), 'buy  milk');
        });
      });

      group('remainingCount', () {
        test('counts nothing in an empty list', () {
          expect(remainingCount(const []), 0);
        });

        test('counts only the tasks that are not done', () {
          const tasks = [
            Task(id: 1, title: 'one'),
            Task(id: 2, title: 'two', done: true),
            Task(id: 3, title: 'three'),
          ];
          expect(remainingCount(tasks), 2);
        });
      });

      group('findTask', () {
        const tasks = [Task(id: 1, title: 'one'), Task(id: 2, title: 'two')];

        test('finds the task with the id', () {
          expect(findTask(tasks, 2)?.title, 'two');
        });

        test('answers null for an id the list does not hold', () {
          expect(findTask(tasks, 9999), isNull);
        });
      });

      group('Task', () {
        test('toggled flips done and keeps everything else', () {
          const task = Task(id: 7, title: 'seven');
          final flipped = task.toggled();
          expect(flipped.done, isTrue);
          expect(flipped.id, 7);
          expect(flipped.title, 'seven');
          expect(task.done, isFalse);
        });
      });
    }
    ```

    Verify: `grep -q "group('checkTitle'" test/rules/task_rules_test.dart`

20. Create `test/rules/rules_are_flutter_free_test.dart`, the test that keeps the rules plain Dart:

    ```dart
    import 'dart:io';

    import 'package:flutter_test/flutter_test.dart';

    /// Import prefixes that would pull the framework into the rules.
    const _forbidden = [
      'package:flutter/',
      'package:flutter_riverpod/',
      'package:go_router/',
      'dart:ui',
    ];

    void main() {
      final sources = Directory('lib/src/rules')
          .listSync()
          .whereType<File>()
          .where((file) => file.path.endsWith('.dart'))
          .toList();

      test('there are rule files to check', () {
        // Without this, moving or renaming the folder would make every check
        // below pass by having nothing to check.
        expect(sources.length, greaterThanOrEqualTo(2));
      });

      for (final source in sources) {
        test('${source.path} imports nothing from the framework', () {
          final text = source.readAsStringSync();
          final found = _forbidden
              .where((prefix) => text.contains("import '$prefix"))
              .toList();
          expect(
            found,
            isEmpty,
            reason:
                'The rules are plain Dart so that they can be tested without '
                'rendering anything. Move whatever needs the framework into '
                'lib/src/state or lib/src/ui.',
          );
        });
      }
    }
    ```

    Verify: `grep -q "imports nothing from the framework" test/rules/rules_are_flutter_free_test.dart`

21. Create `test/state/tasks_notifier_test.dart`:

    ```dart
    import 'package:flutter_riverpod/flutter_riverpod.dart';
    import 'package:flutter_test/flutter_test.dart';
    import 'package:tasks/src/rules/task_rules.dart';
    import 'package:tasks/src/state/tasks_notifier.dart';

    void main() {
      test('starts with an empty list', () {
        final container = ProviderContainer.test();
        expect(container.read(tasksProvider), isEmpty);
      });

      test('adds a task, with the title trimmed', () {
        final container = ProviderContainer.test();
        final problem = container.read(tasksProvider.notifier).add('  buy milk ');
        expect(problem, isNull);
        expect(container.read(tasksProvider).single.title, 'buy milk');
        expect(container.read(tasksProvider).single.done, isFalse);
      });

      test('refuses a blank title and leaves the list alone', () {
        final container = ProviderContainer.test();
        final problem = container.read(tasksProvider.notifier).add('   ');
        expect(problem, TitleProblem.blank);
        expect(container.read(tasksProvider), isEmpty);
      });

      test('refuses a title past the limit and leaves the list alone', () {
        final container = ProviderContainer.test();
        final long = 'a' * (maxTitleLength + 1);
        final problem = container.read(tasksProvider.notifier).add(long);
        expect(problem, TitleProblem.tooLong);
        expect(container.read(tasksProvider), isEmpty);
      });

      test('gives every task its own id, and never reuses one', () {
        final container = ProviderContainer.test();
        container.read(tasksProvider.notifier)
          ..add('one')
          ..add('two')
          ..add('three');
        expect(container.read(tasksProvider).map((task) => task.id), [1, 2, 3]);
      });

      test('toggle flips one task and leaves the others', () {
        final container = ProviderContainer.test();
        container.read(tasksProvider.notifier)
          ..add('one')
          ..add('two')
          ..toggle(2);
        final tasks = container.read(tasksProvider);
        expect(tasks.map((task) => task.done), [false, true]);
        expect(remainingCount(tasks), 1);
      });

      test('toggle ignores an id the list does not hold', () {
        final container = ProviderContainer.test();
        container.read(tasksProvider.notifier)
          ..add('one')
          ..toggle(9999);
        expect(container.read(tasksProvider).single.done, isFalse);
      });
    }
    ```

    Verify: `grep -q "ProviderContainer.test()" test/state/tasks_notifier_test.dart`

22. Create `test/ui/task_list_screen_test.dart`:

    ```dart
    import 'package:flutter/material.dart';
    import 'package:flutter_test/flutter_test.dart';

    import '../app_harness.dart';

    void main() {
      testWidgets('adds a typed task and counts it as remaining', (tester) async {
        await pumpApp(tester);
        expect(find.text('Remaining: 0'), findsOneWidget);

        await addTask(tester, 'buy milk');

        expect(find.text('buy milk'), findsOneWidget);
        expect(find.text('Remaining: 1'), findsOneWidget);
      });

      testWidgets('stores the title trimmed', (tester) async {
        await pumpApp(tester);
        await addTask(tester, '   buy milk   ');
        expect(find.text('buy milk'), findsOneWidget);
      });

      testWidgets('refuses a blank title and says why', (tester) async {
        await pumpApp(tester);
        await addTask(tester, '   ');

        expect(find.text('A task needs a title.'), findsOneWidget);
        expect(find.text('Remaining: 0'), findsOneWidget);
      });

      testWidgets('refuses a title past the limit and says the limit', (
        tester,
      ) async {
        await pumpApp(tester);
        await addTask(tester, 'a' * 81);

        expect(find.text('A title is at most 80 characters.'), findsOneWidget);
        expect(find.text('Remaining: 0'), findsOneWidget);
      });

      testWidgets('ticking a task lowers the remaining count', (tester) async {
        await pumpApp(tester);
        await addTask(tester, 'buy milk');

        await tester.tap(find.byType(Checkbox));
        await tester.pumpAndSettle();

        expect(find.text('Remaining: 0'), findsOneWidget);
        expect(find.text('buy milk'), findsOneWidget);
      });

      testWidgets('meets the accessibility guidelines a test can check', (
        tester,
      ) async {
        final handle = tester.ensureSemantics();
        await pumpApp(tester);
        await addTask(tester, 'buy milk');

        // Every tappable node carries a label a screen reader can read out, and
        // every one is at least 48 by 48 (Android) and 44 by 44 (iOS).
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
        await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));

        handle.dispose();
      });
    }
    ```

    Verify: `grep -q "labeledTapTargetGuideline" test/ui/task_list_screen_test.dart`

23. Create `test/routing/routing_test.dart`:

    ```dart
    import 'package:flutter_test/flutter_test.dart';
    import 'package:tasks/src/routing/routes.dart';

    import '../app_harness.dart';

    void main() {
      group('typed routes', () {
        test('a location is built from the id, never spelled by hand', () {
          expect(const TaskDetailRoute(3).location, '/tasks/3');
          expect(const TaskListRoute().location, '/');
        });

        test('the pattern and the location agree on the parameter name', () {
          expect(TaskDetailRoute.path, '/tasks/:id');
          expect(const TaskDetailRoute(3).location, startsWith('/tasks/'));
        });
      });

      group('the router', () {
        testWidgets('opens the task the row button belongs to', (tester) async {
          await pumpApp(tester);
          await addTask(tester, 'buy milk');

          await tester.tap(find.byTooltip('Open task'));
          await tester.pumpAndSettle();

          expect(find.text('buy milk'), findsOneWidget);
          expect(find.text('Not done'), findsOneWidget);
        });

        testWidgets('comes back to the list', (tester) async {
          await pumpApp(tester);
          await addTask(tester, 'buy milk');
          await tester.tap(find.byTooltip('Open task'));
          await tester.pumpAndSettle();

          await tester.tap(find.text('Back to the task list'));
          await tester.pumpAndSettle();

          expect(find.text('Remaining: 1'), findsOneWidget);
        });

        testWidgets('refuses a malformed id instead of throwing', (tester) async {
          await pumpApp(tester, initialLocation: '/tasks/abc');

          expect(find.text('That page does not exist.'), findsOneWidget);
          expect(tester.takeException(), isNull);
        });

        testWidgets('refuses an id that is not positive', (tester) async {
          await pumpApp(tester, initialLocation: '/tasks/-1');

          expect(find.text('That page does not exist.'), findsOneWidget);
          expect(tester.takeException(), isNull);
        });

        testWidgets('says so when a well-formed id names no task', (tester) async {
          await pumpApp(tester, initialLocation: '/tasks/9999');

          expect(find.text('That task does not exist.'), findsOneWidget);
        });

        testWidgets('sends an unknown location to the missing page', (
          tester,
        ) async {
          await pumpApp(tester, initialLocation: '/nowhere');

          expect(find.text('That page does not exist.'), findsOneWidget);
        });
      });
    }
    ```

    Verify: `grep -q "refuses a malformed id instead of throwing" test/routing/routing_test.dart`

24. Create `.github/workflows/ci.yml`:

    ```yaml
    # The same gate the setup recipe ends with, run on every push.
    #
    # Actions are pinned by commit, not by tag: a tag is a name its owner can move,
    # and a workflow that trusts a movable name trusts whoever can move it.
    name: ci

    on:
      push:
        branches: [main]
      pull_request:

    permissions:
      contents: read

    concurrency:
      group: ci-${{ github.ref }}
      cancel-in-progress: true

    jobs:
      check:
        runs-on: ubuntu-latest
        timeout-minutes: 30
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false

          # The same version the recipe was written against. Flutter decides the
          # Dart version, the analyzer and the formatter, so an unpinned SDK makes
          # every one of the checks below move on its own.
          - uses: subosito/flutter-action@1a449444c387b1966244ae4d4f8c696479add0b2 # v2.23.0
            with:
              flutter-version: 3.47.5
              channel: stable
              cache: true

          - run: flutter pub get

          # The generated localisations are committed, so CI regenerates them and
          # fails if the result differs from what is in the repository.
          - run: flutter gen-l10n
          - run: git diff --exit-code lib/l10n

          - run: dart format --output=none --set-exit-if-changed .

          # No --no-fatal-infos: most lints report at info level, and passing that
          # flag would turn the whole lint set into decoration.
          - run: flutter analyze

          - run: flutter test

          # The build proof. It needs no device, no emulator and no account.
          - run: flutter build web --release
    ```

    Verify: `grep -q "subosito/flutter-action@1a449444c387b1966244ae4d4f8c696479add0b2" .github/workflows/ci.yml`

25. Create `.github/dependabot.yml`:

    ```yaml
    # Every version in this project is pinned, so nothing moves on its own.
    # Dependabot is the other half of that decision: it proposes each update as a
    # pull request CI has to pass, including security fixes. It reads
    # pubspec.yaml and the action commits in the workflow.
    version: 2
    updates:
      - package-ecosystem: pub
        directory: /
        schedule:
          interval: weekly
      - package-ecosystem: github-actions
        directory: /
        schedule:
          interval: weekly
    ```

    Verify: `grep -q "package-ecosystem: pub" .github/dependabot.yml`

26. Check the formatting of everything written above. `--set-exit-if-changed` is what makes this a gate rather than a reformat: nothing is written, and the command fails if any file is not already in the formatter's canonical form: `dart format --output=none --set-exit-if-changed .`
    Verify: `test -z "$(dart format --output=none --show=changed --summary=none .)"`

27. Run the analyzer. Infos are fatal by default in `flutter analyze`, and no `--no-fatal-infos` is passed, so every lint in the pinned set is a build failure: `flutter analyze`
    Verify: `flutter analyze 2>&1 | grep -q "No issues found"`

28. Run the tests with coverage: the title rules, the boundary that keeps the framework out of them, the notifier, both screens and every route: `flutter test --coverage`
    Verify: `grep -q "^SF:lib/src/rules/task_rules.dart" coverage/lcov.info`

29. Build the release web bundle. This is the build proof: it compiles every line of the app with the production compiler, on a machine with no device, no emulator and no account: `flutter build web --release`
    Verify: `grep -qF "That page does not exist." build/web/main.dart.js`
