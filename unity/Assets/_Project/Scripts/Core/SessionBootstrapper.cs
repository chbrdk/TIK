using System.Threading.Tasks;
using PersonaReality.Data;
using UnityEngine;

namespace PersonaReality.Core
{
    /// <summary>
    /// Entry point: loads scene_config (from companion WebSocket or mock in Editor).
    /// </summary>
    public class SessionBootstrapper : MonoBehaviour
    {
        [SerializeField] private SceneConfigLoader configLoader;
        [SerializeField] private ActDirector actDirector;
        [SerializeField] private bool autoLoadMockOnStart;

        [SerializeField] private string mockConfigRelativePath =
            PersonaRealityPaths.StreamingConfigsRoot + "/" + PersonaRealityPaths.DefaultMockConfigFile;

        private void Awake()
        {
            if (configLoader == null)
                configLoader = FindFirstObjectByType<SceneConfigLoader>();
            if (actDirector == null)
                actDirector = FindFirstObjectByType<ActDirector>();
        }

        private async void Start()
        {
            if (autoLoadMockOnStart && Application.isEditor)
                await LoadMockSessionAsync();
        }

        public async Task LoadMockSessionAsync()
        {
            await configLoader.LoadFromStreamingAssets(mockConfigRelativePath);
            OnConfigReady(configLoader.Current);
        }

        public async Task LoadFromJsonAsync(string json)
        {
            await configLoader.LoadFromJson(json);
            OnConfigReady(configLoader.Current);
        }

        private void OnConfigReady(SceneConfig config)
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            Debug.Log($"[PersonaReality] Session loaded: {config.Meta.SceneId} persona={config.Meta.PersonaId}");
#endif
            if (actDirector != null)
                _ = actDirector.StartAct(1);
        }
    }
}
