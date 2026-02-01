"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Shield,
  FileWarning,
  TrendingUp,
  AlertTriangle,
  Sparkles,
  BadgeCheck,
  Info,
  Scale,
  Activity,
} from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ReTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { apiService } from "../services/api";
import LoadingSpinner from "../components/LoadingSpinner";

const MISSING_TEXT = "Can not generate the information. Insufficient Data";

// snake_case -> "Snake case" (sentence-case)
function prettyLabel(key) {
  const s = (key || "").toString().trim().replace(/_/g, " ");
  if (!s) return "";
  const lower = s.toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export default function FraudProfilePage() {
  const { name } = useParams();

  // ----------------------------
  // Helpers
  // ----------------------------
  const safeDecode = (v) => {
    try {
      return decodeURIComponent(v || "");
    } catch {
      return (v || "").toString();
    }
  };

  const isBlank = (v) => v == null || (typeof v === "string" && v.trim() === "");

  const asText = (v) => {
    if (isBlank(v)) return MISSING_TEXT;
    if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") return String(v);

    if (typeof v === "object") {
      if (!isBlank(v.detail)) return String(v.detail);
      if (!isBlank(v.message)) return String(v.message);
      if (!isBlank(v.error)) return String(v.error);
      try {
        const s = JSON.stringify(v);
        return isBlank(s) ? MISSING_TEXT : s;
      } catch {
        return MISSING_TEXT;
      }
    }

    return String(v);
  };

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

  const formatDate = (d) => {
    if (isBlank(d)) return MISSING_TEXT;
    const t = new Date(d);
    return Number.isNaN(t.getTime()) ? MISSING_TEXT : t.toLocaleDateString();
  };

  const decodedName = useMemo(() => safeDecode(name).trim(), [name]);

  // ----------------------------
  // State
  // ----------------------------
  const [posts, setPosts] = useState([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [errorPosts, setErrorPosts] = useState(null);

  const [scoreLoading, setScoreLoading] = useState(true);
  const [scoreError, setScoreError] = useState(null);
  const [scoreWrap, setScoreWrap] = useState(null); // { success, model, entity, response: { ...analysis } }

  const scoreToastFiredRef = useRef(false);
  const fetchedRef = useRef(false);

  // ----------------------------
  // Fetch data
  // ----------------------------
  useEffect(() => {

    if (fetchedRef.current) return;
    fetchedRef.current = true;

    // using to stop double fetch due to strict mode
    const norm = (v) => (v || "").toString().trim().toLowerCase();
    const normPhone = (v) => (v || "").toString().replace(/[^\d+]/g, "").trim();

    const fetchPosts = async () => {
      if (!decodedName) {
        setErrorPosts("Invalid fraudster name");
        setPosts([]);
        setLoadingPosts(false);
        return;
      }

      setLoadingPosts(true);
      setErrorPosts(false);

      try {
        const seedRes = await apiService.searchPosts(decodedName);
        const seed = Array.isArray(seedRes)
            ? seedRes
            : Array.isArray(seedRes?.posts)
                ? seedRes.posts
                : [];

        const names = new Set();
        const emails = new Set();
        const phones = new Set();

        for (const p of seed) {
          if (p?.name) names.add(norm(p.name));
          if (p?.email) emails.add(norm(p.email));
          if (p?.phone) phones.add(normPhone(p.phone));
        }
        names.add(norm(decodedName));

        const all = (await apiService.getPosts()) || [];
        const related = all.filter((p) => {
          const pn = norm(p?.name);
          const pe = norm(p?.email);
          const pp = normPhone(p?.phone);
          return (pn && names.has(pn)) || (pe && emails.has(pe)) || (pp && phones.has(pp));
        });

        const unique = Array.from(
            new Map(related.filter((p) => p?.id).map((p) => [p.id, p])).values()
        ).sort((a, b) => {
          const da = new Date(a.postedAt || a.createdAt || 0).getTime();
          const db = new Date(b.postedAt || b.createdAt || 0).getTime();
          return db - da;
        });

        setPosts(unique);
      } catch (err) {
        console.error("Error fetching posts:", err);
        setErrorPosts(asText(err));
        setPosts([]);
      } finally {
        setLoadingPosts(false);
      }
    };

    const fetchScore = async () => {
      if (!decodedName) {
        setScoreError("Invalid fraudster name");
        setScoreWrap(null);
        setScoreLoading(false);
        return;
      }

      setScoreLoading(true);
      setScoreError(null);

      try {
        const data = await apiService.getScore(decodedName);
        setScoreWrap(data);
      } catch (err) {
        console.error("Error fetching score:", err);
        setScoreError(asText(err));
        setScoreWrap(null);
      } finally {
        setScoreLoading(false);
      }
    };

    scoreToastFiredRef.current = false;
    fetchPosts();
    fetchScore();
  }, [decodedName]);

  // Toast when analysis finishes
  useEffect(() => {
    if (scoreLoading) return;
    if (scoreToastFiredRef.current) return;

    scoreToastFiredRef.current = true;

    if (scoreError) {
      toast.error("AI analysis failed");
      return;
    }

    const analysisObj = scoreWrap?.response || scoreWrap;
    if (analysisObj) toast.success("AI analysis ready");
  }, [scoreLoading, scoreError, scoreWrap]);

  // ----------------------------
  // Derived from JSON schema
  // ----------------------------
  const analysis = scoreWrap?.response || scoreWrap || null;

  const headerEntityName = analysis?.entity_name || scoreWrap?.entity || decodedName || "";
  const analysisStatus = analysis?.analysis_status || "completed";

  const fraudAssessment = analysis?.fraud_assessment || {};
  const riskScore =
      typeof fraudAssessment?.fraud_risk_score === "number"
          ? clamp(fraudAssessment.fraud_risk_score, 0, 100)
          : null;
  const riskLabel = fraudAssessment?.risk_level || null;
  const confidence = fraudAssessment?.confidence || null;

  const summary = analysis?.summary || null;

  const evidenceAnalysis = analysis?.evidence_analysis || {};
  const strongEvidence = Array.isArray(evidenceAnalysis?.strong_evidence) ? evidenceAnalysis.strong_evidence : [];
  const weakEvidence = Array.isArray(evidenceAnalysis?.weak_evidence) ? evidenceAnalysis.weak_evidence : [];
  const contradictingEvidence = Array.isArray(evidenceAnalysis?.contradicting_evidence)
      ? evidenceAnalysis.contradicting_evidence
      : [];
  const evidenceStatus = evidenceAnalysis?.evidence_sufficiency || null;

  const manipulationAnalysis = analysis?.manipulation_analysis || {};
  const suspectedFakeActivity =
      typeof manipulationAnalysis?.suspected_fake_activity === "boolean"
          ? manipulationAnalysis.suspected_fake_activity
          : null;
  const manipulationIndicators = Array.isArray(manipulationAnalysis?.indicators) ? manipulationAnalysis.indicators : [];

  const fraudPatterns = Array.isArray(analysis?.fraud_patterns) ? analysis.fraud_patterns : [];

  const contentStats = analysis?.content_statistics || {};
  const csTotal = typeof contentStats?.total_posts === "number" ? contentStats.total_posts : null;
  const csComplaints =
      typeof contentStats?.posts_with_complaints === "number" ? contentStats.posts_with_complaints : null;
  const csPositive =
      typeof contentStats?.posts_with_positive_feedback === "number"
          ? contentStats.posts_with_positive_feedback
          : null;
  const csNeutral = typeof contentStats?.neutral_posts === "number" ? contentStats.neutral_posts : null;

  const sentiment = analysis?.sentiment_breakdown || {};
  const pos =
      typeof sentiment?.positive_percentage === "number" ? clamp(sentiment.positive_percentage, 0, 100) : null;
  const neu =
      typeof sentiment?.neutral_percentage === "number" ? clamp(sentiment.neutral_percentage, 0, 100) : null;
  const neg =
      typeof sentiment?.negative_percentage === "number" ? clamp(sentiment.negative_percentage, 0, 100) : null;

  const uncertaintyFactors = Array.isArray(analysis?.uncertainty_factors) ? analysis.uncertainty_factors : [];

  const userGuidance = analysis?.user_guidance || {};
  const recommendationLevel = userGuidance?.recommendation_level || null;
  const safetyTips = Array.isArray(userGuidance?.safety_tips) ? userGuidance.safety_tips : [];

  const legalDisclaimer = analysis?.legal_disclaimer || null;

  const categoriesCount = useMemo(() => new Set(posts.map((p) => p?.category).filter(Boolean)).size, [posts]);

  // ----------------------------
  // Chart data
  // ----------------------------
  const sentimentData = useMemo(() => {
    const p = pos ?? 0;
    const n = neu ?? 0;
    const g = neg ?? 0;
    const total = p + n + g;
    if (!analysis || total === 0) return [];
    return [
      { name: "Positive", value: p, color: "#22c55e" },
      { name: "Neutral", value: n, color: "#94a3b8" },
      { name: "Negative", value: g, color: "#ef4444" },
    ];
  }, [analysis, pos, neu, neg]);

  const evidenceCountsData = useMemo(
      () => [
        { name: "Strong", count: strongEvidence.length },
        { name: "Weak", count: weakEvidence.length },
        { name: "Contradict", count: contradictingEvidence.length },
      ],
      [strongEvidence.length, weakEvidence.length, contradictingEvidence.length]
  );

  const gaugeData = useMemo(() => {
    if (typeof riskScore !== "number") return [];
    return [
      {
        name: "Score",
        value: riskScore,
        color: riskScore >= 70 ? "#ef4444" : riskScore >= 40 ? "#f59e0b" : "#22c55e",
      },
      { name: "Remaining", value: 100 - riskScore, color: "rgba(148,163,184,0.25)" },
    ];
  }, [riskScore]);

  const contentStatsData = useMemo(
      () => [
        { name: "Total", count: csTotal ?? 0 },
        { name: "Complaints", count: csComplaints ?? 0 },
        { name: "Positive", count: csPositive ?? 0 },
        { name: "Neutral", count: csNeutral ?? 0 },
      ],
      [csTotal, csComplaints, csPositive, csNeutral]
  );

  // ----------------------------
  // Styling helpers
  // ----------------------------
  const badgeBase = "inline-flex items-center px-3 py-1 rounded-full border text-sm font-semibold";

  const riskBadgeClass = (level) => {
    const v = (level || "").toLowerCase();
    if (v === "safe")
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-900/40";
    if (v === "warning")
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900/40";
    if (v === "medium")
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200 dark:border-orange-900/40";
    if (v === "high" || v === "critical")
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-900/40";
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  const evidenceBadgeClass = (s) => {
    const v = (s || "").toLowerCase();
    if (v.includes("insufficient"))
      return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    if (v.includes("conflict"))
      return "bg-orange-100 text-orange-900 dark:bg-orange-900/30 dark:text-orange-200 border-orange-200 dark:border-orange-900/40";
    if (v.includes("sufficient"))
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-900/40";
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  const suspicionBadgeClass = (flag) => {
    if (flag === true)
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-900/40";
    if (flag === false)
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-900/40";
    return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  const recommendationBadgeClass = (level) => {
    const v = (level ?? "").toString().toLowerCase();

    if (v.includes("safe") || v.includes("proceed") || v.includes("low"))
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border-green-200 dark:border-green-900/40";

    if (v.includes("caution") || v.includes("warn") || v.includes("medium"))
      return "bg-yellow-100 text-yellow-900 dark:bg-yellow-900/30 dark:text-yellow-200 border-yellow-200 dark:border-yellow-900/40";

    if (v.includes("avoid") || v.includes("high") || v.includes("critical"))
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border-red-200 dark:border-red-900/40";

    return "bg-gray-100 text-gray-700 dark:bg-gray-900/50 dark:text-gray-300 border-gray-200 dark:border-gray-700";
  };

  const ChartTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const p = payload[0]?.payload;
    return (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 shadow">
          <div className="text-sm font-semibold text-gray-800 dark:text-gray-100">{asText(p?.name)}</div>
          {"value" in (p || {}) && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {typeof p?.value === "number" ? `${p.value}%` : MISSING_TEXT}
              </div>
          )}
          {"count" in (p || {}) && (
              <div className="text-sm text-gray-600 dark:text-gray-300">
                {typeof p?.count === "number" ? String(p.count) : MISSING_TEXT}
              </div>
          )}
        </div>
    );
  };

  // ----------------------------
  // Render states
  // ----------------------------
  if (loadingPosts) {
    return (
        <div className="flex items-center justify-center min-h-screen">
          <LoadingSpinner />
        </div>
    );
  }

  if (errorPosts) {
    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
          <div className="card p-10 text-center">
            <p className="text-red-600 dark:text-red-400 mb-6 text-base">{asText(errorPosts)}</p>
            <Link to="/home" className="btn btn-primary">
              Back to Home
            </Link>
          </div>
        </div>
    );
  }

  // ----------------------------
  // Page
  // ----------------------------
  return (
      <div className="max-w-8xl mx-auto py-6 px-4">
        {/* Top actions
        <div className="mb-4 flex items-center justify-between gap-3">
          <Link
              to="/home"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>

          <Link
              to={`/search?query=${encodeURIComponent(headerEntityName || decodedName || "")}`}
              className="btn btn-secondary"
              title="Search related reports"
          >
            Search more
          </Link>
        </div>
            */}
        {/* Grid */}
        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* LEFT: Title + Summary */}
          <div className="lg:col-span-7 lg:col-start-1">
            <div className="relative overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
              <div className="absolute inset-0 pointer-events-none bg-gradient-to-br from-primary-50/60 via-transparent to-transparent dark:from-primary-900/10" />
              <div className="absolute -top-28 -right-28 w-72 h-72 rounded-full bg-primary-200/30 blur-3xl dark:bg-primary-500/10 pointer-events-none" />
              <div className="absolute -bottom-28 -left-28 w-72 h-72 rounded-full bg-danger-200/20 blur-3xl dark:bg-danger-500/10 pointer-events-none" />

              <div className="relative p-6 md:p-8">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-8 h-8 text-danger-600 dark:text-danger-400" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 dark:text-gray-100 truncate">
                        {asText(headerEntityName)}
                      </h1>

                      <span
                          className={`inline-flex items-center gap-2 px-4 py-2 rounded-full border text-sm md:text-base font-semibold ${riskBadgeClass(
                              riskLabel
                          )}`}
                          title="fraud_assessment.risk_level"
                      >
                      <AlertTriangle className="w-4 h-4" />
                        {asText(riskLabel)}
                    </span>

                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300">
                      Status: {asText(analysisStatus)}
                    </span>
                    </div>

                    <div className="mt-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                      <div className="flex items-center justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <Info className="w-4 h-4 text-primary-600" />
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">Summary</div>
                        </div>

                        <span
                            className={`${badgeBase} ${evidenceBadgeClass(evidenceStatus)}`}
                            title="evidence_analysis.evidence_sufficiency"
                        >
                        Evidence: {asText(evidenceStatus)}
                      </span>
                      </div>

                      {scoreLoading ? (
                          <div className="text-base text-gray-600 dark:text-gray-300">Generating summary...</div>
                      ) : scoreError ? (
                          <div className="text-base text-gray-600 dark:text-gray-300">{asText(scoreError)}</div>
                      ) : (
                          <p
                              className="text-base font-normal text-gray-800 dark:text-gray-200 leading-relaxed"
                              style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 5,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                          >
                            {asText(summary)}
                          </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                    <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300">
                      <FileWarning className="w-4 h-4 text-primary-600" />
                      Reports: {asText(posts.length)}
                    </span>

                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300">
                      <TrendingUp className="w-4 h-4 text-primary-600" />
                      Categories: {asText(categoriesCount)}
                    </span>

                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300">
                      <Activity className="w-4 h-4 text-primary-600" />
                      Confidence: {asText(confidence)}
                    </span>

                      <span className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 text-sm text-gray-700 dark:text-gray-300">
                      <Sparkles className="w-4 h-4 text-primary-600" />
                      Model: {asText(scoreWrap?.model)}
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT: Risk score */}
          <div className="lg:col-span-5 lg:col-start-8">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/30 backdrop-blur p-5 md:p-6">
              {scoreLoading ? (
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">Risk score</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">Running...</div>
                    </div>
                    <div className="mt-4">
                      <LoadingSpinner />
                    </div>
                  </div>
              ) : scoreError ? (
                  <div>
                    <div className="flex items-center gap-2 text-red-700 dark:text-red-300 text-base font-semibold">
                      <AlertTriangle className="w-5 h-5" />
                      {asText("Analysis failed")}
                    </div>
                    <div className="mt-2 text-base text-red-700 dark:text-red-300">{asText(scoreError)}</div>
                  </div>
              ) : (
                  <div>
                    <div className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Risk score</div>

                    {/* Risk score chart with center value */}
                    <div className="relative h-56">
                      {gaugeData.length ? (
                          <>
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <ReTooltip content={<ChartTooltip />} />
                                <Pie
                                    data={gaugeData}
                                    dataKey="value"
                                    startAngle={360}
                                    endAngle={0}
                                    innerRadius="72%"
                                    outerRadius="95%"
                                    paddingAngle={2}
                                    stroke="transparent"
                                    isAnimationActive={false}
                                >
                                  {gaugeData.map((d, i) => (
                                      <Cell key={i} fill={d.color} />
                                  ))}
                                </Pie>
                              </PieChart>
                            </ResponsiveContainer>

                            {/* Center label */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="text-center">
                                <div
                                    className="text-4xl font-extrabold leading-none"
                                    style={{ color: "#ef4444" }}
                                >
                                  {asText(riskScore)+"%"}
                                </div>
                                <div className="mt-1 text-sm font-medium text-gray-600 dark:text-gray-300">
                                  {asText("Risk score")}
                                </div>
                              </div>
                            </div>
                          </>
                      ) : (
                          <div className="h-full flex items-center justify-center text-base text-gray-500 dark:text-gray-400">
                            {asText(null)}
                          </div>
                      )}
                    </div>


                    <div className="mt-3 flex items-end justify-between">
                      <div className="text-4xl font-semibold text-gray-900 dark:text-gray-100">
                        {asText(riskScore)}
                        <span className="text-base font-normal text-gray-500 dark:text-gray-400">/100</span>
                      </div>

                      <span className={`${badgeBase} ${riskBadgeClass(riskLabel)}`}>{asText(riskLabel)}</span>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* LEFT: Manipulation analysis */}
          <div className="lg:col-span-7 lg:col-start-1 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Manipulation analysis</h2>

              <span className={`${badgeBase} ${suspicionBadgeClass(suspectedFakeActivity)}`}>
              Suspected Fake Activity: {asText(suspectedFakeActivity)}
            </span>
            </div>

            <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">{asText("indicators")}</div>

            <ul className="list-disc pl-5 space-y-2 text-base text-gray-700 dark:text-gray-300">
              {manipulationIndicators?.length ? (
                  manipulationIndicators.map((x, i) => <li key={`ind-${i}`}>{asText(x)}</li>)
              ) : (
                  <li className="opacity-70">{asText(null)}</li>
              )}
            </ul>
          </div>

          {/* RIGHT: Evidence status */}
          <div className="lg:col-span-5 lg:col-start-8 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Evidence status</h2>

              <span className={`inline-flex px-4 py-2 rounded-xl border text-sm font-semibold ${evidenceBadgeClass(evidenceStatus)}`}>
              {asText(evidenceStatus)}
            </span>
            </div>

            <div className="text-base text-gray-700 dark:text-gray-200">
              Confidence: <span className="font-semibold">{asText(confidence)}</span>
            </div>

            <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
              Reports: {asText(posts.length)} • Categories: {asText(categoriesCount)}
            </div>

            <div className="mt-4 text-sm text-gray-600 dark:text-gray-300 flex items-start gap-2">
              <Scale className="w-4 h-4 flex-shrink-0 mt-[2px]" />
              <span className="leading-relaxed">{asText(legalDisclaimer)}</span>
            </div>
          </div>

          {/* LEFT: Fraud patterns */}
          <div className="lg:col-span-7 lg:col-start-1 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-3">
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100">Fraud patterns</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                patterns: {asText(fraudPatterns?.length ?? 0)}
              </div>
            </div>

            <div className="space-y-3 text-base text-gray-700 dark:text-gray-300">
              {fraudPatterns?.length ? (
                  fraudPatterns.map((p, i) => (
                      <div
                          key={`pat-${i}`}
                          className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 p-4"
                      >
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {asText(p?.pattern_name)}
                          </div>

                          <span className="px-3 py-1 rounded-full border border-gray-200 dark:border-gray-700 text-sm text-gray-700 dark:text-gray-300">
                      likelihood: {asText(p?.likelihood)}
                    </span>
                        </div>

                        <div className="text-base text-gray-700 dark:text-gray-300">{asText(p?.description)}</div>
                      </div>
                  ))
              ) : (
                  <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 p-4">
                    {asText(null)}
                  </div>
              )}
            </div>
          </div>

          {/* RIGHT: Sentiment */}
          <div className="lg:col-span-5 lg:col-start-8 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/30 backdrop-blur p-5 md:p-6">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">{asText("Sentiment")}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">{asText("Sentiment Breakdown")}</div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 items-center">
              <div className="h-44">
                {sentimentData.length ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <ReTooltip content={<ChartTooltip />} />
                        <Pie
                            data={sentimentData}
                            dataKey="value"
                            nameKey="name"
                            innerRadius="55%"
                            outerRadius="85%"
                            paddingAngle={2}
                            stroke="transparent"
                            isAnimationActive={false}
                        >
                          {sentimentData.map((d, i) => (
                              <Cell key={i} fill={d.color} />
                          ))}
                        </Pie>
                      </PieChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex items-center justify-center text-base text-gray-500 dark:text-gray-400">
                      {asText(null)}
                    </div>
                )}
              </div>

              <div className="space-y-2">
                <LegendRow label={asText("Positive")} value={pos} color="#22c55e" />
                <LegendRow label={asText("Neutral")} value={neu} color="#94a3b8" />
                <LegendRow label={asText("Negative")} value={neg} color="#ef4444" />
              </div>
            </div>
          </div>

          {/* LEFT: Content statistics */}
          <div className="lg:col-span-7 lg:col-start-1 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Content statistics</h2>
              <div className="text-sm text-gray-500 dark:text-gray-400">Total Posts: {asText(csTotal)}</div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
              <StatChip labelKey="posts_with_complaints" value={csComplaints} />
              <StatChip labelKey="neutral_posts" value={csNeutral} />
              <StatChip labelKey="reports_on_platform" value={posts.length} />
              <StatChip labelKey="categories" value={categoriesCount} />
            </div>

            <div className="h-48 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 p-3">
              {contentStatsData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={(contentStatsData || []).filter((d) => d?.name !== "Positive")}
                        margin={{ top: 10, right: 16, left: -10, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <ReTooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" fill="#a855f7" radius={[10, 10, 10, 10]} />
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex items-center justify-center text-base text-gray-500 dark:text-gray-400">
                    {asText(null)}
                  </div>
              )}
            </div>
          </div>

          {/* RIGHT: User guidance */}
          <div className="lg:col-span-5 lg:col-start-8 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">User guidance</h2>

              <div className="text-sm text-gray-600 dark:text-gray-300 flex items-center gap-2">
                <span>Recommendation Level:</span>

                <span className={`${badgeBase} ${recommendationBadgeClass(recommendationLevel)}`}>
                {asText(recommendationLevel)}
              </span>
              </div>
            </div>

            {safetyTips?.length ? (
                <ul className="list-disc pl-5 space-y-2 text-base text-gray-700 dark:text-gray-300">
                  {safetyTips.map((x, i) => (
                      <li key={`st-${i}`}>{asText(x)}</li>
                  ))}
                </ul>
            ) : (
                <div className="text-base text-gray-600 dark:text-gray-300">{asText(null)}</div>
            )}

            <div className="mt-5 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 p-4">
              <div className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-2">Uncertainty factors</div>
              <ul className="list-disc pl-5 space-y-2 text-base text-gray-700 dark:text-gray-300">
                {uncertaintyFactors?.length ? (
                    uncertaintyFactors.map((x, i) => <li key={`uf-${i}`}>{asText(x)}</li>)
                ) : (
                    <li className="opacity-70">{asText(null)}</li>
                )}
              </ul>
            </div>
          </div>

          {/* FULL WIDTH: Evidence analysis */}
          <div className="lg:col-span-12 lg:col-start-1 card p-6 md:p-8">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="w-6 h-6 text-primary-600" />
                <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Evidence analysis</h2>
              </div>

              <span className={`${badgeBase} ${evidenceBadgeClass(evidenceStatus)}`}>{asText(evidenceStatus)}</span>
            </div>

            <div className="h-56 rounded-2xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 p-3">
              {evidenceCountsData.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={evidenceCountsData} margin={{ top: 10, right: 16, left: -10, bottom: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                      <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <YAxis allowDecimals={false} tick={{ fill: "#94a3b8", fontSize: 12 }} />
                      <ReTooltip content={<ChartTooltip />} />
                      <Bar dataKey="count" fill="#60a5fa" radius={[10, 10, 10, 10]} />
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="h-full flex items-center justify-center text-base text-gray-500 dark:text-gray-400">
                    {asText(null)}
                  </div>
              )}
            </div>

            <div className="mt-5 grid md:grid-cols-3 gap-4">
              <EvidenceList title="strong_evidence" items={strongEvidence} asText={asText} />
              <EvidenceList title="weak_evidence" items={weakEvidence} asText={asText} />
              <EvidenceList title="contradicting_evidence" items={contradictingEvidence} asText={asText} />
            </div>
          </div>
        </div>

        {/* Related Reports */}
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-3">
            <FileWarning className="w-6 h-6 text-primary-600" />
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100">Related Reports</h2>
          </div>

          {posts.length > 0 ? (
              <div className="space-y-4">
                {posts.map((post) => (
                    <Link
                        key={post.id}
                        to={`/post/${post.id}`}
                        className="block rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:shadow-lg transition-shadow"
                    >
                      <div className="p-5 md:p-6 flex items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                      <span className="px-3 py-1 text-sm rounded-lg bg-danger-100 dark:bg-danger-900/30 text-danger-700 dark:text-danger-300">
                        {asText(post?.category)}
                      </span>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                        {asText(formatDate(post?.postedAt || post?.createdAt))}
                      </span>
                          </div>

                          <h3 className="text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                            {asText(post?.title)}
                          </h3>

                          <p className="mt-1 text-base text-gray-600 dark:text-gray-400 leading-relaxed">
                            {post?.description
                                ? `${post.description.slice(0, 180)}${post.description.length > 180 ? "..." : ""}`
                                : asText(post?.description)}
                          </p>
                        </div>

                        <TrendingUp className="w-5 h-5 text-danger-600 flex-shrink-0 mt-1" />
                      </div>
                    </Link>
                ))}
              </div>
          ) : (
              <div className="card p-8 text-center">
                <p className="text-gray-600 dark:text-gray-400 text-base">{asText(null)}</p>
              </div>
          )}
        </div>
      </div>
  );
}

// ----------------------------
// Small UI helpers
// ----------------------------
function LegendRow({ label, value, color }) {
  return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 px-3 py-3">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full" style={{ background: color }} />
          <span className="text-base text-gray-700 dark:text-gray-300 truncate">{label}</span>
        </div>
        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
        {typeof value === "number" ? `${value}%` : MISSING_TEXT}
      </span>
      </div>
  );
}

function EvidenceList({ title, items, asText }) {
  const arr = Array.isArray(items) ? items : [];
  return (
      <div className="rounded-2xl bg-gray-50 dark:bg-gray-900/50 p-5 border border-gray-200/60 dark:border-gray-700/60">
        <div className="flex items-center justify-between mb-3">
          <div className="text-lg font-bold text-gray-900 dark:text-gray-100">{prettyLabel(title)}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{arr.length}</div>
        </div>

        <ul className="list-disc pl-5 space-y-2 text-base text-gray-700 dark:text-gray-300">
          {arr.map((x, i) => (
              <li key={`${title}-${i}`}>{asText(x)}</li>
          ))}
          {arr.length === 0 && <li className="opacity-70">{MISSING_TEXT}</li>}
        </ul>
      </div>
  );
}

function StatChip({ labelKey, value }) {
  return (
      <div className="rounded-xl bg-gray-50 dark:bg-gray-900/50 border border-gray-200/60 dark:border-gray-700/60 px-3 py-3">
        <div className="text-sm text-gray-500 dark:text-gray-400">{prettyLabel(labelKey)}</div>
        <div className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mt-1">
          {typeof value === "number" ? value : MISSING_TEXT}
        </div>
      </div>
  );
}
