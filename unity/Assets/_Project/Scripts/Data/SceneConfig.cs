using System;
using Newtonsoft.Json;
using Newtonsoft.Json.Converters;

namespace PersonaReality.Data
{
    [Serializable]
    public class SceneConfig
    {
        [JsonProperty("meta")] public Meta Meta { get; set; }
        [JsonProperty("persona")] public PersonaData Persona { get; set; }
        [JsonProperty("avatar")] public AvatarData Avatar { get; set; }
        [JsonProperty("environments")] public EnvironmentBinding[] Environments { get; set; }
        [JsonProperty("narrative_beats")] public NarrativeBeatData[] NarrativeBeats { get; set; }
        [JsonProperty("data_layers")] public DataLayers DataLayers { get; set; }
        [JsonProperty("brand_layer")] public BrandLayer BrandLayer { get; set; }
        [JsonProperty("report")] public ReportRef Report { get; set; }
    }

    [Serializable]
    public class Meta
    {
        [JsonProperty("scene_id")] public string SceneId { get; set; }
        [JsonProperty("persona_id")] public string PersonaId { get; set; }
        [JsonProperty("generated_at")] public string GeneratedAt { get; set; }
        [JsonProperty("duration_sec")] public int DurationSec { get; set; }
        [JsonProperty("language")] public string Language { get; set; }
        [JsonProperty("client_id")] public string ClientId { get; set; }
        [JsonProperty("schema_version")] public string SchemaVersion { get; set; }
    }

    [Serializable]
    public class PersonaData
    {
        [JsonProperty("id")] public string Id { get; set; }
        [JsonProperty("display_name")] public string DisplayName { get; set; }
        [JsonProperty("age")] public int Age { get; set; }
        [JsonProperty("gender_expression")] public string GenderExpression { get; set; }
        [JsonProperty("location")] public string Location { get; set; }
        [JsonProperty("occupation")] public string Occupation { get; set; }
        [JsonProperty("household")] public string Household { get; set; }
        [JsonProperty("income_band")] public string IncomeBand { get; set; }
        [JsonProperty("axes")] public PersonaAxes Axes { get; set; }
        [JsonProperty("pain_points")] public string[] PainPoints { get; set; }
        [JsonProperty("decision_drivers")] public string[] DecisionDrivers { get; set; }
    }

    [Serializable]
    public class PersonaAxes
    {
        [JsonProperty("sector")] public string Sector { get; set; }
        [JsonProperty("life_stage")] public string LifeStage { get; set; }
        [JsonProperty("tech_affinity")] public string TechAffinity { get; set; }
        [JsonProperty("decision_style")] public string DecisionStyle { get; set; }
        [JsonProperty("industry")] public string Industry { get; set; }
    }

    [Serializable]
    public class AvatarData
    {
        [JsonProperty("rpm_avatar_id")] public string RpmAvatarId { get; set; }
        [JsonProperty("voice_id_elevenlabs")] public string VoiceIdElevenlabs { get; set; }
        [JsonProperty("outfit_preset")] public string OutfitPreset { get; set; }
    }

    [Serializable]
    public class EnvironmentBinding
    {
        [JsonProperty("act")] public int Act { get; set; }
        [JsonProperty("environment_id")] public string EnvironmentId { get; set; }
        [JsonProperty("lighting_preset")] public string LightingPreset { get; set; }
        [JsonProperty("time_of_day")] public string TimeOfDay { get; set; }
        [JsonProperty("weather")] public string Weather { get; set; }
        [JsonProperty("skybox_id")] public string SkyboxId { get; set; }
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum TriggerType
    {
        [JsonProperty("timer")] Timer,
        [JsonProperty("look_at")] LookAt,
        [JsonProperty("pickup")] Pickup,
        [JsonProperty("sit_down")] SitDown,
        [JsonProperty("stand_up")] StandUp,
        [JsonProperty("scene_enter")] SceneEnter,
        [JsonProperty("ui_interact")] UiInteract
    }

    [JsonConverter(typeof(StringEnumConverter))]
    public enum HapticPattern
    {
        [JsonProperty("none")] None,
        [JsonProperty("soft_pulse")] SoftPulse,
        [JsonProperty("double_tap")] DoubleTap,
        [JsonProperty("alert")] Alert
    }

    [Serializable]
    public class NarrativeBeatData
    {
        [JsonProperty("act")] public int Act { get; set; }
        [JsonProperty("trigger_type")] public TriggerType TriggerType { get; set; }
        [JsonProperty("trigger_target")] public string TriggerTarget { get; set; }
        [JsonProperty("delay_sec")] public float DelaySec { get; set; }
        [JsonProperty("duration_sec")] public float DurationSec { get; set; }
        [JsonProperty("voiceover_track_id")] public string VoiceoverTrackId { get; set; }
        [JsonProperty("ambient_audio_id")] public string AmbientAudioId { get; set; }
        [JsonProperty("haptic_pattern")] public HapticPattern HapticPattern { get; set; }
        [JsonProperty("ui_overlay")] public UiOverlay UiOverlay { get; set; }
    }

    [Serializable]
    public class UiOverlay
    {
        [JsonProperty("type")] public string Type { get; set; }
        [JsonProperty("anchor_object")] public string AnchorObject { get; set; }
        [JsonProperty("payload")] public Newtonsoft.Json.Linq.JObject Payload { get; set; }
    }

    [Serializable]
    public class DataLayers
    {
        [JsonProperty("echeon")] public EcheonLayer Echeon { get; set; }
        [JsonProperty("checkion")] public CheckionSnapshot Checkion { get; set; }
        [JsonProperty("audion")] public AudionLayer Audion { get; set; }
        [JsonProperty("storyblok")] public StoryblokLayer Storyblok { get; set; }
    }

    [Serializable]
    public class EcheonLayer
    {
        [JsonProperty("feed_items")] public EcheonFeedItem[] FeedItems { get; set; }
        [JsonProperty("cache_ttl_sec")] public int CacheTtlSec { get; set; }
    }

    [Serializable]
    public class EcheonFeedItem
    {
        [JsonProperty("headline")] public string Headline { get; set; }
        [JsonProperty("source")] public string Source { get; set; }
        [JsonProperty("category")] public string Category { get; set; }
        [JsonProperty("relevance_score")] public float RelevanceScore { get; set; }
        [JsonProperty("published_at")] public string PublishedAt { get; set; }
        [JsonProperty("url")] public string Url { get; set; }
    }

    [Serializable]
    public class CheckionSnapshot
    {
        [JsonProperty("metrics")] public CheckionMetric[] Metrics { get; set; }
    }

    [Serializable]
    public class CheckionMetric
    {
        [JsonProperty("label")] public string Label { get; set; }
        [JsonProperty("value")] public float Value { get; set; }
        [JsonProperty("unit")] public string Unit { get; set; }
        [JsonProperty("comparison_value")] public float? ComparisonValue { get; set; }
        [JsonProperty("trend")] public string Trend { get; set; }
    }

    [Serializable]
    public class AudionLayer
    {
        [JsonProperty("diegetic_metrics")] public DiegeticMetric[] DiegeticMetrics { get; set; }
    }

    [Serializable]
    public class DiegeticMetric
    {
        [JsonProperty("metric_id")] public string MetricId { get; set; }
        [JsonProperty("label")] public string Label { get; set; }
        [JsonProperty("value")] public float Value { get; set; }
        [JsonProperty("unit")] public string Unit { get; set; }
        [JsonProperty("anchor_object")] public string AnchorObject { get; set; }
        [JsonProperty("animation_preset")] public string AnimationPreset { get; set; }
    }

    [Serializable]
    public class StoryblokLayer
    {
        [JsonProperty("page_variant_a_texture")] public string PageVariantATexture { get; set; }
        [JsonProperty("page_variant_b_texture")] public string PageVariantBTexture { get; set; }
    }

    [Serializable]
    public class BrandLayer
    {
        [JsonProperty("client_id")] public string ClientId { get; set; }
        [JsonProperty("logo_texture")] public string LogoTexture { get; set; }
        [JsonProperty("color_primary")] public string ColorPrimary { get; set; }
        [JsonProperty("color_secondary")] public string ColorSecondary { get; set; }
        [JsonProperty("props_swap")] public PropSwap[] PropsSwap { get; set; }
    }

    [Serializable]
    public class PropSwap
    {
        [JsonProperty("from_asset")] public string FromAsset { get; set; }
        [JsonProperty("to_asset")] public string ToAsset { get; set; }
    }

    [Serializable]
    public class ReportRef
    {
        [JsonProperty("qr_url")] public string QrUrl { get; set; }
        [JsonProperty("report_id")] public string ReportId { get; set; }
    }
}
