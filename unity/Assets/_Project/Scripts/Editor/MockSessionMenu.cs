using PersonaReality.Core;
using UnityEditor;
using UnityEngine;

namespace PersonaReality.Editor
{
    public static class MockSessionMenu
    {
        private const string MenuRoot = "Tools/Persona Reality/";

        [MenuItem(MenuRoot + "Load Mock Session (Klaus DE)")]
        public static async void LoadMockSession()
        {
            var loader = EnsureLoader();
            var bootstrapper = Object.FindFirstObjectByType<SessionBootstrapper>();

            var relativePath = $"{PersonaRealityPaths.StreamingConfigsRoot}/{PersonaRealityPaths.DefaultMockConfigFile}";

            if (!Application.isPlaying)
            {
                Debug.LogWarning("[PersonaReality] Enter Play Mode to load a mock session at runtime.");
                return;
            }

            await loader.LoadFromStreamingAssets(relativePath);

            if (bootstrapper != null)
                Debug.Log("[PersonaReality] Mock session loaded. Assign SessionBootstrapper for auto act start.");
        }

        [MenuItem(MenuRoot + "Validate Mock JSON (Edit Mode)")]
        public static void ValidateMockJson()
        {
            SceneConfigJsonTests.ValidateGoldenFixture();
        }

        [MenuItem(MenuRoot + "Create Runtime Bootstrap Objects")]
        public static void CreateBootstrapObjects()
        {
            var root = new GameObject("_PersonaReality");
            root.AddComponent<SceneConfigLoader>();
            root.AddComponent<ActDirector>();
            root.AddComponent<BeatTriggerSystem>();
            root.AddComponent<SessionManager>();
            var bootstrap = root.AddComponent<SessionBootstrapper>();
            Undo.RegisterCreatedObjectUndo(root, "Create Persona Reality Bootstrap");
            Selection.activeGameObject = root;
            Debug.Log("[PersonaReality] Created _PersonaReality root. Wire ActDirector timelines in inspector.");
        }

        private static SceneConfigLoader EnsureLoader()
        {
            var loader = Object.FindFirstObjectByType<SceneConfigLoader>();
            if (loader != null) return loader;

            var go = new GameObject("SceneConfigLoader");
            loader = go.AddComponent<SceneConfigLoader>();
            return loader;
        }
    }
}
