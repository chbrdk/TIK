using System;
using System.Threading.Tasks;
using PersonaReality.Data;
using UnityEngine;
using UnityEngine.Playables;

namespace PersonaReality.Core
{
    /// <summary>Swaps act timelines and environments. Phase 1: logs act transitions.</summary>
    public class ActDirector : MonoBehaviour
    {
        [SerializeField] private PlayableDirector director;
        [SerializeField] private PlayableAsset[] actTimelines = new PlayableAsset[5];
        [SerializeField] private Transform environmentRoot;

        public int CurrentAct { get; private set; }
        public event Action<int> OnActStart;
        public event Action<int> OnActEnd;

        public async Task StartAct(int actNumber)
        {
            if (actNumber < 1 || actNumber > 5)
                throw new ArgumentOutOfRangeException(nameof(actNumber));

            if (CurrentAct > 0)
                OnActEnd?.Invoke(CurrentAct);

            CurrentAct = actNumber;
            var binding = GetEnvironmentForAct(actNumber);

#if UNITY_EDITOR || DEVELOPMENT_BUILD
            Debug.Log($"[ActDirector] Act {actNumber} env={binding?.EnvironmentId} lighting={binding?.LightingPreset}");
#endif

            // Phase 2: Addressables env swap + fade
            await Task.Delay(100);

            if (director != null && actTimelines != null && actNumber - 1 < actTimelines.Length && actTimelines[actNumber - 1] != null)
            {
                director.playableAsset = actTimelines[actNumber - 1];
                director.Play();
            }

            var beats = FindFirstObjectByType<BeatTriggerSystem>();
            beats?.ArmBeatsForAct(actNumber);

            OnActStart?.Invoke(actNumber);
        }

        public async Task AdvanceToNextAct()
        {
            if (CurrentAct >= 5) return;
            await StartAct(CurrentAct + 1);
        }

        private EnvironmentBinding GetEnvironmentForAct(int act)
        {
            var loader = SceneConfigLoader.Instance;
            if (loader?.Current?.Environments == null) return null;

            foreach (var env in loader.Current.Environments)
            {
                if (env.Act == act) return env;
            }

            return null;
        }
    }
}
