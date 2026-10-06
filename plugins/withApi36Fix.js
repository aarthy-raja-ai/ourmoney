const { withProjectBuildGradle, withGradleProperties } = require('@expo/config-plugins');

/**
 * Expo Config Plugin to enable Android API 36 (targetSdkVersion 36) compilation
 * on Expo SDK 51 without Kotlin compiler failure in :expo-modules-core.
 */
function withApi36Fix(config) {
  // 1. Add android.suppressUnsupportedCompileSdk=36 to gradle.properties for AGP 8.2
  config = withGradleProperties(config, (config) => {
    config.modResults = config.modResults.filter(
      (item) => item.key !== 'android.suppressUnsupportedCompileSdk'
    );
    config.modResults.push({
      type: 'property',
      key: 'android.suppressUnsupportedCompileSdk',
      value: '36',
    });
    return config;
  });

  // 2. Configure JVM Target 17 for Kotlin compile tasks in all subprojects (including expo-modules-core)
  config = withProjectBuildGradle(config, (config) => {
    if (config.modResults.language === 'groovy') {
      const codeToInject = `
subprojects {
    afterEvaluate { project ->
        if (project.hasProperty("android")) {
            project.android {
                compileOptions {
                    sourceCompatibility JavaVersion.VERSION_17
                    targetCompatibility JavaVersion.VERSION_17
                }
            }
        }
        tasks.withType(org.jetbrains.kotlin.gradle.tasks.KotlinCompile).configureEach {
            kotlinOptions {
                jvmTarget = "17"
            }
        }
    }
}
`;
      if (!config.modResults.contents.includes('jvmTarget = "17"')) {
        config.modResults.contents += codeToInject;
      }
    }
    return config;
  });

  return config;
}

module.exports = withApi36Fix;
