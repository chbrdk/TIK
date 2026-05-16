using System;
using UnityEngine;

namespace PersonaReality.Core
{
    public class SessionManager : MonoBehaviour
    {
        public static SessionManager Instance { get; private set; }

        public event Action OnSessionComplete;

        private void Awake()
        {
            if (Instance != null && Instance != this)
            {
                Destroy(gameObject);
                return;
            }

            Instance = this;
        }

        public void NotifyComplete()
        {
#if UNITY_EDITOR || DEVELOPMENT_BUILD
            Debug.Log("[SessionManager] Session complete — ready for next visitor");
#endif
            OnSessionComplete?.Invoke();
        }
    }
}
