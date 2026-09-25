# Setup

Creates a single-module Android app in Kotlin with Jetpack Compose: one screen
whose state lives in a ViewModel, unit tests for the rules and the ViewModel,
a Compose UI test that runs on the JVM under Robolectric, Android lint with
warnings as errors, an unsigned R8-shrunk release build, and CI.

Run every step from the empty directory that will hold the project. Each step
is one action and ends with the command that proves it worked. Stop at the
first verification that fails.

Requires JDK 21 or newer on `PATH`, and the Android SDK at `ANDROID_HOME` with
its licences accepted — Android Studio's SDK Manager does both, and so does a
GitHub-hosted Ubuntu runner. Nothing needs a device, an emulator or an account.
Gradle downloads the platform and build tools it is missing into
`ANDROID_HOME`, and everything else from Google's Maven repository and Maven
Central.

1. Confirm Gradle will find the Android SDK. The Android Gradle plugin reads `ANDROID_HOME`; with it unset, the first build fails with an error about `sdk.dir`: `test -n "$ANDROID_HOME"`
   Verify: `test -d "$ANDROID_HOME/licenses"`

2. Create `gradle/libs.versions.toml` with:

   ```toml
   # Every version the build uses, in one place. Each one was read from Google's
   # Maven repository, Maven Central or services.gradle.org on 2026-09-25.
   #
   # The Compose libraries carry no version here: the BOM pins all of them
   # together, which is what keeps ui, material3 and ui-test from drifting apart.

   [versions]
   agp = "9.4.1"
   kotlin = "2.4.20"
   composeBom = "2026.09.00"
   activityCompose = "1.13.0"
   lifecycle = "2.11.0"
   junit = "4.13.2"
   androidxTestExtJunit = "1.3.0"
   espresso = "3.7.0"
   robolectric = "4.17"

   [libraries]
   androidx-activity-compose = { module = "androidx.activity:activity-compose", version.ref = "activityCompose" }
   androidx-lifecycle-viewmodel-compose = { module = "androidx.lifecycle:lifecycle-viewmodel-compose", version.ref = "lifecycle" }
   androidx-lifecycle-runtime-compose = { module = "androidx.lifecycle:lifecycle-runtime-compose", version.ref = "lifecycle" }
   androidx-compose-bom = { module = "androidx.compose:compose-bom", version.ref = "composeBom" }
   androidx-compose-ui = { module = "androidx.compose.ui:ui" }
   androidx-compose-ui-tooling-preview = { module = "androidx.compose.ui:ui-tooling-preview" }
   androidx-compose-ui-tooling = { module = "androidx.compose.ui:ui-tooling" }
   androidx-compose-material3 = { module = "androidx.compose.material3:material3" }
   androidx-compose-ui-test-junit4 = { module = "androidx.compose.ui:ui-test-junit4" }
   androidx-compose-ui-test-manifest = { module = "androidx.compose.ui:ui-test-manifest" }
   junit = { module = "junit:junit", version.ref = "junit" }
   androidx-test-ext-junit = { module = "androidx.test.ext:junit", version.ref = "androidxTestExtJunit" }
   androidx-test-espresso-core = { module = "androidx.test.espresso:espresso-core", version.ref = "espresso" }
   robolectric = { module = "org.robolectric:robolectric", version.ref = "robolectric" }

   [plugins]
   android-application = { id = "com.android.application", version.ref = "agp" }
   # AGP 9 compiles Kotlin itself. The Compose compiler plugin is the one Kotlin
   # plugin applied, and its version is the Kotlin version the build uses.
   kotlin-compose = { id = "org.jetbrains.kotlin.plugin.compose", version.ref = "kotlin" }
   ```

   Verify: `grep -q 'agp = "9.4.1"' gradle/libs.versions.toml`

3. Create `settings.gradle.kts` with:

   ```kotlin
   // Two repositories and nothing else. Google's is restricted to the groups
   // Google publishes, so a package with the same name cannot be substituted
   // from the other one; Maven Central serves the rest, including the Compose
   // compiler plugin. No project may add a repository of its own.
   pluginManagement {
       repositories {
           google {
               content {
                   includeGroupByRegex("com\\.android.*")
                   includeGroupByRegex("com\\.google.*")
                   includeGroupByRegex("androidx.*")
               }
           }
           mavenCentral()
       }
   }

   dependencyResolutionManagement {
       repositoriesMode.set(RepositoriesMode.FAIL_ON_PROJECT_REPOS)
       repositories {
           google {
               content {
                   includeGroupByRegex("com\\.android.*")
                   includeGroupByRegex("com\\.google.*")
                   includeGroupByRegex("androidx.*")
               }
           }
           mavenCentral()
       }
   }

   rootProject.name = "tasks"
   include(":app")
   ```

   Verify: `grep -q 'include(":app")' settings.gradle.kts`

4. Create `.gitignore` with:

   ```gitignore
   # Build output and Gradle's per-project cache, including the bootstrap copy
   # of Gradle the setup unpacked.
   .gradle/
   .kotlin/
   build/
   captures/
   .cxx/

   # Machine-specific: the SDK path Android Studio writes, and IDE state.
   local.properties
   .idea/
   *.iml

   # Signing material never enters the repository. Release signing is
   # configured outside it; see AGENTS.md.
   *.jks
   *.keystore
   *.p12
   keystore.properties
   ```

   Verify: `grep -q "^\*.jks$" .gitignore`

5. Create `gradle.properties` with:

   ```properties
   # The daemon needs room for R8 and lint on the release build.
   org.gradle.jvmargs=-Xmx4g -Dfile.encoding=UTF-8
   # Reuse the configuration between builds; AGP 9 and every plugin here
   # support it, and a plugin added later that does not will say so.
   org.gradle.configuration-cache=true
   kotlin.code.style=official
   ```

   Verify: `grep -q "configuration-cache=true" gradle.properties`

6. Create `build.gradle.kts` with:

   ```kotlin
   // Plugins are declared here once, with their versions from the catalog, and
   // applied in the module that uses them.
   plugins {
       alias(libs.plugins.android.application) apply false
       alias(libs.plugins.kotlin.compose) apply false
   }
   ```

   Verify: `test -f build.gradle.kts`

7. Create `app/build.gradle.kts` with:

   ```kotlin
   plugins {
       alias(libs.plugins.android.application)
       alias(libs.plugins.kotlin.compose)
   }

   android {
       // example.com is reserved for documentation. Google Play refuses an
       // application ID under com.example, so change both before publishing.
       namespace = "com.example.tasks"
       // Compose 1.12 requires compileSdk 37 and AGP 9.
       compileSdk = 37

       defaultConfig {
           applicationId = "com.example.tasks"
           // Android 8.0: the launcher icon is an adaptive vector with no
           // bitmap fallbacks.
           minSdk = 26
           // Google Play requires 36 or higher from 2026-08-31. 37 is the
           // current platform, and lint warns on anything older.
           targetSdk = 37
           versionCode = 1
           versionName = "1.0.0"
       }

       buildTypes {
           release {
               // R8 shrinks, optimises and obfuscates the release build.
               isMinifyEnabled = true
               isShrinkResources = true
               proguardFiles(
                   getDefaultProguardFile("proguard-android-optimize.txt"),
                   "proguard-rules.pro",
               )
               // No signingConfig on purpose: assembleRelease produces
               // app-release-unsigned.apk, and no key is ever in this build.
           }
       }

       compileOptions {
           sourceCompatibility = JavaVersion.VERSION_17
           targetCompatibility = JavaVersion.VERSION_17
       }

       buildFeatures {
           compose = true
       }

       testOptions {
           // Robolectric needs the merged resources to render Compose on the JVM.
           unitTests.isIncludeAndroidResources = true
           // Robolectric reaches into the JDK's file descriptors to simulate
           // Android's shared memory, which JDK 17 and later refuse unless the
           // test JVM opens exactly these two packages. Only tests get them.
           unitTests.all {
               it.jvmArgs(
                   "--add-exports=java.base/jdk.internal.access=ALL-UNNAMED",
                   "--add-opens=java.base/java.io=ALL-UNNAMED",
               )
           }
       }

       lint {
           warningsAsErrors = true
           abortOnError = true
           // These four report the calendar, not the code: each one turns red
           // when somebody else publishes a release, on a commit that changed
           // nothing. Version updates are a pull request of their own.
           disable += setOf(
               "GradleDependency",
               "AndroidGradlePluginVersion",
               "NewerVersionAvailable",
               "OldTargetApi",
           )
       }
   }

   kotlin {
       compilerOptions {
           allWarningsAsErrors = true
       }
   }

   dependencies {
       implementation(platform(libs.androidx.compose.bom))
       implementation(libs.androidx.activity.compose)
       implementation(libs.androidx.lifecycle.viewmodel.compose)
       implementation(libs.androidx.lifecycle.runtime.compose)
       implementation(libs.androidx.compose.ui)
       implementation(libs.androidx.compose.ui.tooling.preview)
       implementation(libs.androidx.compose.material3)
       debugImplementation(libs.androidx.compose.ui.tooling)
       // Registers the empty activity createComposeRule() starts.
       debugImplementation(libs.androidx.compose.ui.test.manifest)

       testImplementation(platform(libs.androidx.compose.bom))
       testImplementation(libs.junit)
       testImplementation(libs.androidx.test.ext.junit)
       testImplementation(libs.androidx.compose.ui.test.junit4)
       // Compose's test library brings Espresso 3.5.0, which calls an Android
       // method API 37 removed; under Robolectric every screen test fails
       // without the newer one.
       testImplementation(libs.androidx.test.espresso.core)
       testImplementation(libs.robolectric)
   }
   ```

   Verify: `grep -q "isMinifyEnabled = true" app/build.gradle.kts`

8. Create `app/proguard-rules.pro` with:

   ```proguard
   # Project-specific R8 rules. Empty on purpose: AndroidX and Compose ship
   # their own consumer rules, and this app uses no reflection of its own.
   # A rule added here says which class needs it and why.
   ```

   Verify: `test -f app/proguard-rules.pro`

9. Create `app/src/main/AndroidManifest.xml` with:

   ```xml
   <?xml version="1.0" encoding="utf-8"?>
   <!-- No uses-permission: the app reads nothing and reaches no network.
        Add the smallest permission that works, when a feature needs it. -->
   <manifest xmlns:android="http://schemas.android.com/apk/res/android">

       <!-- Nothing leaves the device through Android's backup or a device
            transfer until somebody decides what may: allowBackup covers
            Android 11 and earlier, dataExtractionRules Android 12 and later. -->
       <application
           android:allowBackup="false"
           android:dataExtractionRules="@xml/data_extraction_rules"
           android:fullBackupContent="false"
           android:icon="@mipmap/ic_launcher"
           android:label="@string/app_name"
           android:supportsRtl="true"
           android:theme="@style/Theme.Tasks">

           <activity
               android:name=".MainActivity"
               android:exported="true">
               <intent-filter>
                   <action android:name="android.intent.action.MAIN" />
                   <category android:name="android.intent.category.LAUNCHER" />
               </intent-filter>
           </activity>
       </application>
   </manifest>
   ```

   Verify: `grep -q 'android:allowBackup="false"' app/src/main/AndroidManifest.xml`

10. Create `app/src/main/res/xml/data_extraction_rules.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <!-- Every domain excluded from cloud backup and from device-to-device
         transfer. Include a path here only once you know what it holds. -->
    <data-extraction-rules>
        <cloud-backup>
            <exclude domain="root" path="." />
            <exclude domain="file" path="." />
            <exclude domain="database" path="." />
            <exclude domain="sharedpref" path="." />
            <exclude domain="external" path="." />
        </cloud-backup>
        <device-transfer>
            <exclude domain="root" path="." />
            <exclude domain="file" path="." />
            <exclude domain="database" path="." />
            <exclude domain="sharedpref" path="." />
            <exclude domain="external" path="." />
        </device-transfer>
    </data-extraction-rules>
    ```

    Verify: `grep -q "<device-transfer>" app/src/main/res/xml/data_extraction_rules.xml`

11. Create `app/src/main/res/values/strings.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
        <string name="app_name">Tasks</string>
        <string name="new_task_label">New task</string>
        <string name="add">Add</string>
        <string name="title_blank">Enter a title</string>
        <plurals name="title_too_long">
            <item quantity="one">Keep it to %1$d character</item>
            <item quantity="other">Keep it to %1$d characters</item>
        </plurals>
        <plurals name="remaining">
            <item quantity="one">%1$d task left</item>
            <item quantity="other">%1$d tasks left</item>
        </plurals>
    </resources>
    ```

    Verify: `grep -q 'name="remaining"' app/src/main/res/values/strings.xml`

12. Create `app/src/main/res/values/themes.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
        <!-- The window theme only. Everything drawn is Compose's MaterialTheme,
             so no AppCompat or Material Components dependency is needed. -->
        <style name="Theme.Tasks" parent="android:Theme.Material.Light.NoActionBar" />
    </resources>
    ```

    Verify: `grep -q "Theme.Tasks" app/src/main/res/values/themes.xml`

13. Create `app/src/main/res/values/colors.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <resources>
        <color name="ic_launcher_background">#FF3D5AFE</color>
    </resources>
    ```

    Verify: `test -f app/src/main/res/values/colors.xml`

14. Create `app/src/main/res/drawable/ic_launcher_foreground.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <!-- A check mark inside the adaptive icon's 66dp safe zone. -->
    <vector xmlns:android="http://schemas.android.com/apk/res/android"
        android:width="108dp"
        android:height="108dp"
        android:viewportWidth="108"
        android:viewportHeight="108">
        <path
            android:fillColor="#FFFFFFFF"
            android:pathData="M45,64.2L35.4,54.6L31.2,58.8L45,72.6L76.8,40.8L72.6,36.6Z" />
    </vector>
    ```

    Verify: `test -f app/src/main/res/drawable/ic_launcher_foreground.xml`

15. Create `app/src/main/res/mipmap-anydpi/ic_launcher.xml` with:

    ```xml
    <?xml version="1.0" encoding="utf-8"?>
    <!-- The monochrome layer is what Android 13 and later use for themed icons. -->
    <adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
        <background android:drawable="@color/ic_launcher_background" />
        <foreground android:drawable="@drawable/ic_launcher_foreground" />
        <monochrome android:drawable="@drawable/ic_launcher_foreground" />
    </adaptive-icon>
    ```

    Verify: `test -f app/src/main/res/mipmap-anydpi/ic_launcher.xml`

16. Create `app/src/main/java/com/example/tasks/domain/Task.kt` with:

    ```kotlin
    package com.example.tasks.domain

    /**
     * A task as the app understands it.
     *
     * Nothing in this package imports android.*, androidx.* or Compose, and
     * DomainBoundaryTest fails the build if something does. The rules live
     * here so that they run as plain JVM tests and outlast the UI toolkit.
     */
    data class Task(val id: Long, val title: String, val done: Boolean = false)
    ```

    Verify: `test -f app/src/main/java/com/example/tasks/domain/Task.kt`

17. Create `app/src/main/java/com/example/tasks/domain/TaskTitle.kt` with:

    ```kotlin
    package com.example.tasks.domain

    /** The longest title accepted, counted after trimming. */
    const val MAX_TITLE_LENGTH = 80

    /** Why a title was refused. The UI maps each one to a string resource; no text lives here. */
    enum class TitleProblem { Blank, TooLong }

    /** The result of checking a title: the cleaned title, or the reason it was refused. */
    sealed interface TitleCheck {
        data class Accepted(val title: String) : TitleCheck

        data class Refused(val problem: TitleProblem) : TitleCheck
    }

    /** The one rule for a task title: trimmed, not blank, at most [MAX_TITLE_LENGTH] characters. */
    fun checkTitle(raw: String): TitleCheck {
        val title = raw.trim()
        return when {
            title.isEmpty() -> TitleCheck.Refused(TitleProblem.Blank)
            title.length > MAX_TITLE_LENGTH -> TitleCheck.Refused(TitleProblem.TooLong)
            else -> TitleCheck.Accepted(title)
        }
    }
    ```

    Verify: `grep -q "fun checkTitle" app/src/main/java/com/example/tasks/domain/TaskTitle.kt`

18. Create `app/src/main/java/com/example/tasks/ui/tasks/TasksUiState.kt` with:

    ```kotlin
    package com.example.tasks.ui.tasks

    import com.example.tasks.domain.Task
    import com.example.tasks.domain.TitleProblem

    /**
     * Everything the screen draws, as one immutable value. The screen reads it;
     * only TasksViewModel makes a new one.
     */
    data class TasksUiState(
        val tasks: List<Task> = emptyList(),
        val draft: String = "",
        val problem: TitleProblem? = null,
    ) {
        val remaining: Int
            get() = tasks.count { !it.done }
    }
    ```

    Verify: `test -f app/src/main/java/com/example/tasks/ui/tasks/TasksUiState.kt`

19. Create `app/src/main/java/com/example/tasks/ui/tasks/TasksViewModel.kt` with:

    ```kotlin
    package com.example.tasks.ui.tasks

    import androidx.lifecycle.ViewModel
    import com.example.tasks.domain.Task
    import com.example.tasks.domain.TitleCheck
    import com.example.tasks.domain.checkTitle
    import kotlinx.coroutines.flow.MutableStateFlow
    import kotlinx.coroutines.flow.StateFlow
    import kotlinx.coroutines.flow.asStateFlow
    import kotlinx.coroutines.flow.update

    /**
     * The only writer of [TasksUiState]. Events come in as method calls and
     * state goes out as [uiState]; the screen never holds a copy it could
     * change on its own.
     *
     * State is in memory. It survives a rotation, because a ViewModel outlives
     * the activity's configuration change, and it is lost when the process dies.
     */
    class TasksViewModel : ViewModel() {
        private val state = MutableStateFlow(TasksUiState())
        val uiState: StateFlow<TasksUiState> = state.asStateFlow()

        fun onDraftChange(text: String) {
            state.update { it.copy(draft = text, problem = null) }
        }

        fun onAdd() {
            // update() may run its lambda more than once under contention, so
            // the lambda derives everything from `current` and has no side effects.
            state.update { current ->
                when (val check = checkTitle(current.draft)) {
                    is TitleCheck.Accepted -> {
                        val id = (current.tasks.maxOfOrNull { it.id } ?: 0L) + 1L
                        current.copy(
                            tasks = current.tasks + Task(id = id, title = check.title),
                            draft = "",
                            problem = null,
                        )
                    }
                    is TitleCheck.Refused -> current.copy(problem = check.problem)
                }
            }
        }

        fun onToggle(id: Long) {
            state.update { current ->
                current.copy(
                    tasks = current.tasks.map { if (it.id == id) it.copy(done = !it.done) else it },
                )
            }
        }
    }
    ```

    Verify: `grep -q "val uiState: StateFlow<TasksUiState>" app/src/main/java/com/example/tasks/ui/tasks/TasksViewModel.kt`

20. Create `app/src/main/java/com/example/tasks/ui/theme/Theme.kt` with:

    ```kotlin
    package com.example.tasks.ui.theme

    import androidx.compose.foundation.isSystemInDarkTheme
    import androidx.compose.material3.MaterialTheme
    import androidx.compose.material3.darkColorScheme
    import androidx.compose.material3.lightColorScheme
    import androidx.compose.runtime.Composable

    /** Material 3's baseline colours, following the system's dark setting. */
    @Composable
    fun TasksTheme(
        darkTheme: Boolean = isSystemInDarkTheme(),
        content: @Composable () -> Unit,
    ) {
        MaterialTheme(
            colorScheme = if (darkTheme) darkColorScheme() else lightColorScheme(),
            content = content,
        )
    }
    ```

    Verify: `test -f app/src/main/java/com/example/tasks/ui/theme/Theme.kt`

21. Create `app/src/main/java/com/example/tasks/ui/tasks/TasksScreen.kt` with:

    ```kotlin
    package com.example.tasks.ui.tasks

    import androidx.compose.foundation.layout.Arrangement
    import androidx.compose.foundation.layout.Column
    import androidx.compose.foundation.layout.Row
    import androidx.compose.foundation.layout.fillMaxSize
    import androidx.compose.foundation.layout.fillMaxWidth
    import androidx.compose.foundation.layout.padding
    import androidx.compose.foundation.lazy.LazyColumn
    import androidx.compose.foundation.lazy.items
    import androidx.compose.foundation.selection.toggleable
    import androidx.compose.foundation.text.KeyboardActions
    import androidx.compose.foundation.text.KeyboardOptions
    import androidx.compose.material3.Button
    import androidx.compose.material3.Checkbox
    import androidx.compose.material3.MaterialTheme
    import androidx.compose.material3.OutlinedTextField
    import androidx.compose.material3.Scaffold
    import androidx.compose.material3.Text
    import androidx.compose.runtime.Composable
    import androidx.compose.runtime.getValue
    import androidx.compose.ui.Alignment
    import androidx.compose.ui.Modifier
    import androidx.compose.ui.res.pluralStringResource
    import androidx.compose.ui.res.stringResource
    import androidx.compose.ui.semantics.Role
    import androidx.compose.ui.text.input.ImeAction
    import androidx.compose.ui.tooling.preview.Preview
    import androidx.compose.ui.unit.dp
    import androidx.lifecycle.compose.collectAsStateWithLifecycle
    import androidx.lifecycle.viewmodel.compose.viewModel
    import com.example.tasks.R
    import com.example.tasks.domain.MAX_TITLE_LENGTH
    import com.example.tasks.domain.Task
    import com.example.tasks.domain.TitleProblem
    import com.example.tasks.ui.theme.TasksTheme

    /**
     * The screen wired to its ViewModel. collectAsStateWithLifecycle stops
     * collecting when the app is in the background, which a plain
     * collectAsState does not.
     */
    @Composable
    fun TasksRoute(
        modifier: Modifier = Modifier,
        viewModel: TasksViewModel = viewModel(),
    ) {
        val state by viewModel.uiState.collectAsStateWithLifecycle()
        TasksScreen(
            state = state,
            onDraftChange = viewModel::onDraftChange,
            onAdd = viewModel::onAdd,
            onToggle = viewModel::onToggle,
            modifier = modifier,
        )
    }

    /** Stateless: it draws [state] and reports events. Previews and tests call it directly. */
    @Composable
    fun TasksScreen(
        state: TasksUiState,
        onDraftChange: (String) -> Unit,
        onAdd: () -> Unit,
        onToggle: (Long) -> Unit,
        modifier: Modifier = Modifier,
    ) {
        val problem = state.problem
        Scaffold(modifier = modifier) { padding ->
            Column(
                modifier = Modifier.fillMaxSize().padding(padding).padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
            ) {
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    OutlinedTextField(
                        value = state.draft,
                        onValueChange = onDraftChange,
                        label = { Text(stringResource(R.string.new_task_label)) },
                        isError = problem != null,
                        supportingText = if (problem != null) {
                            { Text(problemText(problem)) }
                        } else {
                            null
                        },
                        singleLine = true,
                        keyboardOptions = KeyboardOptions(imeAction = ImeAction.Done),
                        keyboardActions = KeyboardActions(onDone = { onAdd() }),
                        modifier = Modifier.weight(1f),
                    )
                    Button(onClick = onAdd, modifier = Modifier.padding(top = 8.dp)) {
                        Text(stringResource(R.string.add))
                    }
                }
                Text(
                    text = pluralStringResource(R.plurals.remaining, state.remaining, state.remaining),
                    style = MaterialTheme.typography.labelLarge,
                )
                LazyColumn(modifier = Modifier.fillMaxSize()) {
                    items(state.tasks, key = { it.id }) { task ->
                        TaskRow(task = task, onToggle = { onToggle(task.id) })
                    }
                }
            }
        }
    }

    /**
     * One row is one toggle: the whole row is the touch target and a screen
     * reader announces it as a checkbox with the title as its label.
     */
    @Composable
    private fun TaskRow(
        task: Task,
        onToggle: () -> Unit,
        modifier: Modifier = Modifier,
    ) {
        Row(
            modifier = modifier
                .fillMaxWidth()
                .toggleable(value = task.done, role = Role.Checkbox, onValueChange = { onToggle() })
                .padding(vertical = 12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically,
        ) {
            Checkbox(checked = task.done, onCheckedChange = null)
            Text(text = task.title, style = MaterialTheme.typography.bodyLarge)
        }
    }

    @Composable
    private fun problemText(problem: TitleProblem): String =
        when (problem) {
            TitleProblem.Blank -> stringResource(R.string.title_blank)
            TitleProblem.TooLong ->
                pluralStringResource(R.plurals.title_too_long, MAX_TITLE_LENGTH, MAX_TITLE_LENGTH)
        }

    @Preview(showBackground = true)
    @Composable
    private fun TasksScreenPreview() {
        TasksTheme {
            TasksScreen(
                state = TasksUiState(
                    tasks = listOf(Task(1, "Write the first test"), Task(2, "Run it", done = true)),
                ),
                onDraftChange = {},
                onAdd = {},
                onToggle = {},
            )
        }
    }
    ```

    Verify: `grep -q "collectAsStateWithLifecycle()" app/src/main/java/com/example/tasks/ui/tasks/TasksScreen.kt`

22. Create `app/src/main/java/com/example/tasks/MainActivity.kt` with:

    ```kotlin
    package com.example.tasks

    import android.os.Bundle
    import androidx.activity.ComponentActivity
    import androidx.activity.compose.setContent
    import androidx.activity.enableEdgeToEdge
    import com.example.tasks.ui.tasks.TasksRoute
    import com.example.tasks.ui.theme.TasksTheme

    /** The one activity. It sets up the window and hands everything else to Compose. */
    class MainActivity : ComponentActivity() {
        override fun onCreate(savedInstanceState: Bundle?) {
            super.onCreate(savedInstanceState)
            // Targeting 35 and later draws edge to edge regardless; this makes
            // it explicit, and Scaffold's padding keeps content clear of the bars.
            enableEdgeToEdge()
            setContent {
                TasksTheme {
                    TasksRoute()
                }
            }
        }
    }
    ```

    Verify: `test -f app/src/main/java/com/example/tasks/MainActivity.kt`

23. Create `app/src/test/java/com/example/tasks/domain/TaskTitleTest.kt` with:

    ```kotlin
    package com.example.tasks.domain

    import org.junit.Assert.assertEquals
    import org.junit.Test

    class TaskTitleTest {
        @Test
        fun trimsTheTitle() {
            assertEquals(TitleCheck.Accepted("Buy milk"), checkTitle("  Buy milk \n"))
        }

        @Test
        fun refusesABlankTitle() {
            assertEquals(TitleCheck.Refused(TitleProblem.Blank), checkTitle(" \t "))
        }

        @Test
        fun acceptsATitleExactlyAtTheLimit() {
            val title = "a".repeat(MAX_TITLE_LENGTH)
            assertEquals(TitleCheck.Accepted(title), checkTitle(title))
        }

        @Test
        fun refusesATitleOneOverTheLimit() {
            assertEquals(
                TitleCheck.Refused(TitleProblem.TooLong),
                checkTitle("a".repeat(MAX_TITLE_LENGTH + 1)),
            )
        }
    }
    ```

    Verify: `test -f app/src/test/java/com/example/tasks/domain/TaskTitleTest.kt`

24. Create `app/src/test/java/com/example/tasks/domain/DomainBoundaryTest.kt` with:

    ```kotlin
    package com.example.tasks.domain

    import java.io.File
    import org.junit.Assert.assertEquals
    import org.junit.Assert.assertTrue
    import org.junit.Test

    /**
     * The boundary AGENTS.md states, as a test: the domain package imports no
     * Android, AndroidX or Compose type. Gradle runs unit tests with the module
     * directory as the working directory, so the path is relative to app/.
     */
    class DomainBoundaryTest {
        @Test
        fun theDomainImportsNothingFromAndroid() {
            val sources = File("src/main/java/com/example/tasks/domain")
                .walk()
                .filter { it.isFile && it.extension == "kt" }
                .toList()
            // A loop over nothing asserts nothing: if the package moves, this fails
            // rather than passing forever.
            assertTrue("no domain sources found", sources.isNotEmpty())

            val offending = sources.flatMap { file ->
                file.readLines()
                    .filter { it.startsWith("import android.") || it.startsWith("import androidx.") }
                    .map { "${file.name}: $it" }
            }
            assertEquals(emptyList<String>(), offending)
        }
    }
    ```

    Verify: `test -f app/src/test/java/com/example/tasks/domain/DomainBoundaryTest.kt`

25. Create `app/src/test/java/com/example/tasks/ui/tasks/TasksViewModelTest.kt` with:

    ```kotlin
    package com.example.tasks.ui.tasks

    import com.example.tasks.domain.TitleProblem
    import org.junit.Assert.assertEquals
    import org.junit.Assert.assertNull
    import org.junit.Assert.assertTrue
    import org.junit.Test

    /** The ViewModel on the plain JVM: no Robolectric, no dispatcher to replace. */
    class TasksViewModelTest {
        private val viewModel = TasksViewModel()

        private val state: TasksUiState
            get() = viewModel.uiState.value

        @Test
        fun aValidDraftBecomesATaskAndTheDraftClears() {
            viewModel.onDraftChange("  Buy milk ")
            viewModel.onAdd()

            assertEquals(listOf("Buy milk"), state.tasks.map { it.title })
            assertEquals("", state.draft)
            assertNull(state.problem)
            assertEquals(1, state.remaining)
        }

        @Test
        fun aBlankDraftIsRefusedAndKept() {
            viewModel.onDraftChange("   ")
            viewModel.onAdd()

            assertTrue(state.tasks.isEmpty())
            assertEquals(TitleProblem.Blank, state.problem)
            assertEquals("   ", state.draft)
        }

        @Test
        fun editingTheDraftClearsTheProblem() {
            viewModel.onAdd()
            viewModel.onDraftChange("B")

            assertNull(state.problem)
        }

        @Test
        fun togglingChangesOnlyThatTask() {
            viewModel.onDraftChange("First")
            viewModel.onAdd()
            viewModel.onDraftChange("Second")
            viewModel.onAdd()
            val first = state.tasks.first().id

            viewModel.onToggle(first)
            assertEquals(listOf(true, false), state.tasks.map { it.done })
            assertEquals(1, state.remaining)

            viewModel.onToggle(first)
            assertEquals(listOf(false, false), state.tasks.map { it.done })
        }

        @Test
        fun everyTaskGetsItsOwnId() {
            repeat(3) {
                viewModel.onDraftChange("Task $it")
                viewModel.onAdd()
            }

            assertEquals(3, state.tasks.map { it.id }.toSet().size)
        }
    }
    ```

    Verify: `test -f app/src/test/java/com/example/tasks/ui/tasks/TasksViewModelTest.kt`

26. Create `app/src/test/java/com/example/tasks/ui/tasks/TasksScreenTest.kt` with:

    ```kotlin
    package com.example.tasks.ui.tasks

    import androidx.compose.ui.test.assertIsDisplayed
    import androidx.compose.ui.test.assertIsOff
    import androidx.compose.ui.test.assertIsOn
    import androidx.compose.ui.test.hasSetTextAction
    import androidx.compose.ui.test.junit4.v2.createComposeRule
    import androidx.compose.ui.test.onNodeWithText
    import androidx.compose.ui.test.performClick
    import androidx.compose.ui.test.performTextInput
    import androidx.test.ext.junit.runners.AndroidJUnit4
    import com.example.tasks.ui.theme.TasksTheme
    import org.junit.Before
    import org.junit.Rule
    import org.junit.Test
    import org.junit.runner.RunWith

    /**
     * The real screen and a real ViewModel, rendered by Robolectric on the JVM.
     * Nodes are found by the text a user sees and a screen reader announces, so
     * a control that loses its label fails here.
     */
    @RunWith(AndroidJUnit4::class)
    class TasksScreenTest {
        @get:Rule
        val compose = createComposeRule()

        @Before
        fun showTheScreen() {
            // Constructed outside the composition, as lifecycle's lint requires:
            // a ViewModel built inside a composable is rebuilt on recomposition.
            val viewModel = TasksViewModel()
            compose.setContent {
                TasksTheme {
                    TasksRoute(viewModel = viewModel)
                }
            }
        }

        private fun add(title: String) {
            compose.onNode(hasSetTextAction()).performTextInput(title)
            compose.onNodeWithText("Add").performClick()
        }

        @Test
        fun anAddedTaskIsShownAndCounted() {
            add("  Buy milk ")

            compose.onNodeWithText("Buy milk").assertIsDisplayed().assertIsOff()
            compose.onNodeWithText("1 task left").assertIsDisplayed()
        }

        @Test
        fun aBlankTitleIsRefusedWithTheReason() {
            add("   ")

            compose.onNodeWithText("Enter a title").assertIsDisplayed()
            compose.onNodeWithText("0 tasks left").assertIsDisplayed()
        }

        @Test
        fun tappingARowTogglesTheTask() {
            add("Buy milk")

            compose.onNodeWithText("Buy milk").performClick()

            compose.onNodeWithText("Buy milk").assertIsOn()
            compose.onNodeWithText("0 tasks left").assertIsDisplayed()
        }
    }
    ```

    Verify: `test -f app/src/test/java/com/example/tasks/ui/tasks/TasksScreenTest.kt`

27. Create `.github/workflows/ci.yml` with:

    ```yaml
    name: ci

    on:
      push:
      pull_request:

    permissions:
      contents: read

    jobs:
      build:
        # A pinned image rather than ubuntu-latest: it carries the JDKs and the
        # Android SDK, with licences accepted, that this build relies on.
        runs-on: ubuntu-24.04
        timeout-minutes: 30
        steps:
          - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
            with:
              persist-credentials: false
          # Fails when gradle/wrapper/gradle-wrapper.jar is not a JAR Gradle
          # published: the one binary in the repository is checked on every run.
          - uses: gradle/actions/wrapper-validation@9c971963bec38e04b3d30dcc455b5382be2fdbfb # v6.3.0
          - uses: actions/setup-java@de7274f081f381c8f8158605e0321c36c376e2e6 # v6.0.1
            with:
              distribution: temurin
              java-version: '21'
              cache: gradle
          - run: ./gradlew --no-daemon lint testDebugUnitTest assembleDebug assembleRelease
    ```

    Verify: `grep -q "wrapper-validation@9c971963bec38e04b3d30dcc455b5382be2fdbfb" .github/workflows/ci.yml`

28. Create `.github/dependabot.yml` with:

    ```yaml
    # Every version here is pinned, so nothing moves on its own. Dependabot
    # proposes each update as a pull request CI has to pass, including security
    # fixes; it reads gradle/libs.versions.toml and the workflow's action SHAs.
    version: 2
    updates:
      - package-ecosystem: gradle
        directory: /
        schedule:
          interval: weekly
      - package-ecosystem: github-actions
        directory: /
        schedule:
          interval: weekly
    ```

    Verify: `grep -q "package-ecosystem: gradle" .github/dependabot.yml`

29. Download Gradle 9.7.1 into Gradle's own per-project cache directory, which step 4 keeps out of git. It is used once, to generate the wrapper: `curl -fsSL --create-dirs -o .gradle/bootstrap/gradle-9.7.1-bin.zip https://services.gradle.org/distributions/gradle-9.7.1-bin.zip`
    Verify: `test -s .gradle/bootstrap/gradle-9.7.1-bin.zip`

30. Record the checksum the archive must have, as Gradle published it for 9.7.1 and read on 2026-09-25: `echo "acd53f1edaf02f1a8ff99879f8a34b302661a057d9b063ae9e35b552f804d20a  gradle-9.7.1-bin.zip" > .gradle/bootstrap/gradle-9.7.1-bin.zip.sha256`
    Verify: `cd .gradle/bootstrap && sha256sum -c gradle-9.7.1-bin.zip.sha256`

31. Unpack it with the JDK's own archive tool, so the recipe needs no `unzip`: `cd .gradle/bootstrap && jar xf gradle-9.7.1-bin.zip`
    Verify: `test -f .gradle/bootstrap/gradle-9.7.1/bin/gradle`

32. Generate the Gradle wrapper, pinned to 9.7.1 and to the distribution's SHA-256 so that every later download is checked against it: `sh .gradle/bootstrap/gradle-9.7.1/bin/gradle --no-daemon wrapper --gradle-version 9.7.1 --distribution-type bin --gradle-distribution-sha256-sum acd53f1edaf02f1a8ff99879f8a34b302661a057d9b063ae9e35b552f804d20a`
    Verify: `grep -q "^distributionSha256Sum=acd53f1edaf02f1a8ff99879f8a34b302661a057d9b063ae9e35b552f804d20a" gradle/wrapper/gradle-wrapper.properties`

33. Record the checksum Gradle publishes for the 9.7.1 wrapper JAR, the one binary this project commits: `echo "7a9ce74cff467ca1bf60a4fcd9f05185acceda4d0f382434d393e17864262c5d  gradle/wrapper/gradle-wrapper.jar" > .gradle/bootstrap/gradle-wrapper.jar.sha256`
    Verify: `sha256sum -c .gradle/bootstrap/gradle-wrapper.jar.sha256`

34. Remove the downloaded archive, which is not part of the project. The unpacked copy stays under `.gradle/`, which is ignored and safe to delete: `rm .gradle/bootstrap/gradle-9.7.1-bin.zip`
    Verify: `test ! -e .gradle/bootstrap/gradle-9.7.1-bin.zip`

35. Run the wrapper once. It downloads the same distribution to Gradle's user home and refuses it if the SHA-256 differs: `./gradlew --version`
    Verify: `./gradlew --version | grep -q "^Gradle 9.7.1$"`

36. Run the unit tests: the title rules, the domain boundary, the ViewModel, and the screen under Robolectric. The first run downloads Robolectric's Android 17 runtime from Maven Central: `./gradlew testDebugUnitTest`
    Verify: `grep -q 'tests="3" skipped="0" failures="0" errors="0"' app/build/test-results/testDebugUnitTest/TEST-com.example.tasks.ui.tasks.TasksScreenTest.xml`

37. Confirm the ViewModel tests ran and passed, rather than being skipped: `test -f app/build/test-results/testDebugUnitTest/TEST-com.example.tasks.ui.tasks.TasksViewModelTest.xml`
    Verify: `grep -q 'tests="5" skipped="0" failures="0" errors="0"' app/build/test-results/testDebugUnitTest/TEST-com.example.tasks.ui.tasks.TasksViewModelTest.xml`

38. Run Android lint with every warning treated as an error: `./gradlew lint`
    Verify: `test -f app/build/reports/lint-results-debug.html`

39. Build the debug APK: `./gradlew assembleDebug`
    Verify: `test -s app/build/outputs/apk/debug/app-debug.apk`

40. Build the release APK with R8 and no signing configuration: `./gradlew assembleRelease`
    Verify: `test -s app/build/outputs/mapping/release/mapping.txt`

41. Confirm the release APK carries no signature, so no key was used or needed: `test -s app/build/outputs/apk/release/app-release-unsigned.apk`
    Verify: `! "$ANDROID_HOME/build-tools/36.0.0/apksigner" verify app/build/outputs/apk/release/app-release-unsigned.apk`

42. Read the release APK's manifest as the package manager will: `"$ANDROID_HOME/build-tools/36.0.0/aapt2" dump badging app/build/outputs/apk/release/app-release-unsigned.apk > app/build/release-badging.txt`
    Verify: `grep -q "targetSdkVersion:'37'" app/build/release-badging.txt`

43. Prove the release build is not debuggable and requests no permission beyond the signature-level one AndroidX Core declares for its own unexported receivers: `grep -q "package: name='com.example.tasks'" app/build/release-badging.txt`
    Verify: `! grep -E "application-debuggable|uses-permission" app/build/release-badging.txt | grep -qv "uses-permission: name='com.example.tasks.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION'"`
