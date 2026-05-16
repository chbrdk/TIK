using System;
using System.Collections.Generic;
using System.Linq;
using PersonaReality.Data;
using PersonaReality.Triggers;
using UnityEngine;

namespace PersonaReality.Core
{
    public class BeatTriggerSystem : MonoBehaviour
    {
        public event Action<NarrativeBeatData> OnBeatFired;

        private readonly List<NarrativeBeatData> _armedBeats = new();
        private readonly List<TriggerBase> _triggers = new();

        private void Awake()
        {
            _triggers.AddRange(FindObjectsByType<TriggerBase>(FindObjectsSortMode.None));
            foreach (var trigger in _triggers)
                trigger.Fired += OnTriggerFired;
        }

        private void OnDestroy()
        {
            foreach (var trigger in _triggers)
                trigger.Fired -= OnTriggerFired;
        }

        public void ArmBeatsForAct(int act)
        {
            _armedBeats.Clear();
            var loader = SceneConfigLoader.Instance;
            if (loader?.Current?.NarrativeBeats == null) return;

            _armedBeats.AddRange(loader.Current.NarrativeBeats.Where(b => b.Act == act));
        }

        private void OnTriggerFired(TriggerBase trigger)
        {
            foreach (var beat in _armedBeats)
            {
                if (!trigger.MatchesBeat(beat)) continue;
                OnBeatFired?.Invoke(beat);
                return;
            }
        }

        public void FireBeatManually(NarrativeBeatData beat) => OnBeatFired?.Invoke(beat);
    }
}
