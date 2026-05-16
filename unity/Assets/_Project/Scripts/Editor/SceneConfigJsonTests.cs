using System.IO;
using Newtonsoft.Json;
using PersonaReality.Core;
using PersonaReality.Data;
using UnityEngine;

namespace PersonaReality.Editor
{
    /// <summary>Edit-mode validation for golden scene_config JSON (no Unity Test Framework required).</summary>
    public static class SceneConfigJsonTests
    {
        public static void ValidateGoldenFixture()
        {
            var path = Path.Combine(
                Application.streamingAssetsPath,
                PersonaRealityPaths.StreamingConfigsRoot,
                PersonaRealityPaths.DefaultMockConfigFile);

            if (!File.Exists(path))
            {
                Debug.LogError($"[PersonaReality] Golden fixture missing: {path}");
                return;
            }

            var json = File.ReadAllText(path);
            var config = SceneConfigLoader.ParseJson(json);

            Assert(config != null, "deserialization returned null");
            Assert(config.Meta?.PersonaId == "klaus_dortmund", "persona_id");
            Assert(config.Environments?.Length == 5, "five environments");
            Assert(config.NarrativeBeats?.Length >= 5, "narrative beats");
            Assert(config.DataLayers?.Echeon?.FeedItems?.Length > 0, "echeon feed");
            Assert(config.DataLayers?.Checkion?.Metrics?.Length > 0, "checkion metrics");

            Debug.Log($"[PersonaReality] Golden JSON OK — {config.Persona.DisplayName}, scene={config.Meta.SceneId}");
        }

        private static void Assert(bool condition, string label)
        {
            if (!condition)
                throw new JsonException($"Golden fixture assertion failed: {label}");
        }
    }
}
