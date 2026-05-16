using System;
using PersonaReality.Data;
using UnityEngine;

namespace PersonaReality.Triggers
{
    public abstract class TriggerBase : MonoBehaviour
    {
        [SerializeField] private string beatId;
        [SerializeField] private TriggerType triggerType = TriggerType.SceneEnter;

        public string BeatId => beatId;
        public TriggerType TriggerType => triggerType;
        public event Action<TriggerBase> Fired;

        public virtual bool MatchesBeat(NarrativeBeatData beat)
        {
            if (beat.TriggerType != triggerType) return false;
            if (string.IsNullOrEmpty(beat.TriggerTarget)) return string.IsNullOrEmpty(beatId);
            return string.Equals(beat.TriggerTarget, beatId, StringComparison.OrdinalIgnoreCase);
        }

        protected void Fire() => Fired?.Invoke(this);
    }
}
