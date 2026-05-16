using System;
using System.IO;
using System.Threading.Tasks;
using Newtonsoft.Json;
using PersonaReality.Data;
using UnityEngine;

namespace PersonaReality.Core
{
    public class SceneConfigLoader : MonoBehaviour
    {
        public static SceneConfigLoader Instance { get; private set; }

        public SceneConfig Current { get; private set; }
        public bool IsLoaded => Current != null;

        public event Action<SceneConfig> OnConfigLoaded;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
            DontDestroyOnLoad(gameObject);
        }

        private void OnDestroy()
        {
            if (Instance == this)
                Instance = null;
        }

        public async Task LoadFromJson(string json)
        {
            if (string.IsNullOrWhiteSpace(json))
                throw new ArgumentException("scene_config JSON is empty", nameof(json));

            var settings = new JsonSerializerSettings
            {
                MissingMemberHandling = MissingMemberHandling.Ignore,
                NullValueHandling = NullValueHandling.Include
            };

            Current = JsonConvert.DeserializeObject<SceneConfig>(json, settings);
            if (Current?.Meta == null)
                throw new InvalidDataException("scene_config missing meta block");

            ValidateMinimum(Current);
            await ResolveAllReferencesAsync();
            OnConfigLoaded?.Invoke(Current);
        }

        public async Task LoadFromStreamingAssets(string relativePath)
        {
            var fullPath = Path.Combine(Application.streamingAssetsPath, relativePath);
            if (!File.Exists(fullPath))
                throw new FileNotFoundException($"scene_config not found: {fullPath}");

            var json = await File.ReadAllTextAsync(fullPath);
            await LoadFromJson(json);
        }

        public static SceneConfig ParseJson(string json)
        {
            return JsonConvert.DeserializeObject<SceneConfig>(json);
        }

        private static void ValidateMinimum(SceneConfig config)
        {
            if (string.IsNullOrEmpty(config.Meta.SceneId))
                throw new InvalidDataException("meta.scene_id is required");
            if (string.IsNullOrEmpty(config.Meta.PersonaId))
                throw new InvalidDataException("meta.persona_id is required");
            if (config.Environments == null || config.Environments.Length != 5)
                throw new InvalidDataException("environments must contain exactly 5 entries");
            if (config.Persona?.Axes == null)
                throw new InvalidDataException("persona.axes is required");
        }

        /// <summary>Phase 1: no-op. Phase 2+: batch Addressables resolution.</summary>
        private Task ResolveAllReferencesAsync()
        {
            return Task.CompletedTask;
        }
    }
}
