const dataset = window.ANREVIEW_DATA;

const state = {
  selectedId: null,
  view: "browse",
  college: "all",
  search: "",
  type: "all",
  school: "all",
  level: "all",
  sort: "rating",
  reviewSort: "upvotes",
  reviewSemester: "all",
  reviewYear: "all",
  sharedReviews: [],
  reportCount: 0,
  syncState: "Connecting to local ANReview server...",
  authMode: "signin",
  authReady: false,
  editingReviewId: null
};

const analytics = {
  measurementId: "",
  ready: false,
  lastPagePath: ""
};

const authState = {
  client: null,
  session: null,
  user: null,
  profile: null
};

const elements = {
  courseCount: document.getElementById("course-count"),
  staffCount: document.getElementById("staff-count"),
  reviewCount: document.getElementById("review-count"),
  syncStatus: document.getElementById("sync-status"),
  moderationCount: document.getElementById("moderation-count"),
  allCollegesTab: document.getElementById("all-colleges-tab"),
  cbeTab: document.getElementById("cbe-tab"),
  lawTab: document.getElementById("law-tab"),
  cassTab: document.getElementById("cass-tab"),
  capTab: document.getElementById("cap-tab"),
  csmTab: document.getElementById("csm-tab"),
  cssTab: document.getElementById("css-tab"),
  coursesTab: document.getElementById("courses-tab"),
  professorsTab: document.getElementById("professors-tab"),
  searchForm: document.getElementById("directory-search-form"),
  searchInput: document.getElementById("search-input"),
  contextFilterLabel: document.getElementById("context-filter-label"),
  schoolFilter: document.getElementById("school-filter"),
  levelFilter: document.getElementById("level-filter"),
  sortFilter: document.getElementById("sort-filter"),
  resultsMeta: document.getElementById("results-meta"),
  resultsGrid: document.getElementById("results-grid"),
  browseView: document.getElementById("browse-view"),
  detailPage: document.getElementById("detail-page"),
  backToResults: document.getElementById("back-to-results"),
  backToSearch: document.getElementById("back-to-search"),
  prevItem: document.getElementById("prev-item"),
  nextItem: document.getElementById("next-item"),
  detailEmpty: document.getElementById("detail-empty"),
  detailView: document.getElementById("detail-view"),
  detailType: document.getElementById("detail-type"),
  detailTitle: document.getElementById("detail-title"),
  detailSubtitle: document.getElementById("detail-subtitle"),
  detailScore: document.getElementById("detail-score"),
  metricOverall: document.getElementById("metric-overall"),
  metricALabel: document.getElementById("metric-a-label"),
  metricA: document.getElementById("metric-a"),
  metricBLabel: document.getElementById("metric-b-label"),
  metricB: document.getElementById("metric-b"),
  metricCLabel: document.getElementById("metric-c-label"),
  metricC: document.getElementById("metric-c"),
  detailFacts: document.getElementById("detail-facts"),
  reviewSummary: document.getElementById("review-summary"),
  reviewSortFilter: document.getElementById("review-sort-filter"),
  reviewSemesterFilter: document.getElementById("review-semester-filter"),
  reviewYearFilter: document.getElementById("review-year-filter"),
  reviewList: document.getElementById("review-list"),
  reviewForm: document.getElementById("review-form"),
  reviewAuthor: document.getElementById("review-author"),
  reviewPanelSubtitle: document.getElementById("review-panel-subtitle"),
  reviewOverall: document.getElementById("review-overall"),
  reviewSemesterField: document.getElementById("review-semester-field"),
  reviewSemester: document.getElementById("review-semester"),
  reviewYearField: document.getElementById("review-year-field"),
  reviewYear: document.getElementById("review-year"),
  reviewAcademicField: document.getElementById("review-academic-field"),
  reviewAcademicSearch: document.getElementById("review-academic-search"),
  reviewAcademic: document.getElementById("review-academic"),
  reviewAcademicOther: document.getElementById("review-academic-other"),
  reviewMetricALabel: document.getElementById("review-metric-a-label"),
  reviewMetricA: document.getElementById("review-metric-a"),
  reviewMetricBLabel: document.getElementById("review-metric-b-label"),
  reviewMetricB: document.getElementById("review-metric-b"),
  reviewMetricCLabel: document.getElementById("review-metric-c-label"),
  reviewMetricC: document.getElementById("review-metric-c"),
  reviewComment: document.getElementById("review-comment"),
  linkedReviewToggleWrap: document.getElementById("linked-review-toggle-wrap"),
  linkedReviewEnabled: document.getElementById("linked-review-enabled"),
  linkedReviewToggleCopy: document.getElementById("linked-review-toggle-copy"),
  linkedReviewToggleSubcopy: document.getElementById("linked-review-toggle-subcopy"),
  linkedReviewHint: document.getElementById("linked-review-hint"),
  linkedReviewPanel: document.getElementById("linked-review-panel"),
  linkedReviewTitle: document.getElementById("linked-review-title"),
  linkedReviewSubtitle: document.getElementById("linked-review-subtitle"),
  linkedReviewSearchLabel: document.getElementById("linked-review-search-label"),
  linkedReviewSearch: document.getElementById("linked-review-search"),
  linkedReviewTargetLabel: document.getElementById("linked-review-target-label"),
  linkedReviewTarget: document.getElementById("linked-review-target"),
  linkedReviewOverall: document.getElementById("linked-review-overall"),
  linkedReviewSemesterField: document.getElementById("linked-review-semester-field"),
  linkedReviewSemester: document.getElementById("linked-review-semester"),
  linkedReviewYearField: document.getElementById("linked-review-year-field"),
  linkedReviewYear: document.getElementById("linked-review-year"),
  linkedReviewAcademicField: document.getElementById("linked-review-academic-field"),
  linkedReviewAcademicSearch: document.getElementById("linked-review-academic-search"),
  linkedReviewAcademic: document.getElementById("linked-review-academic"),
  linkedReviewAcademicOther: document.getElementById("linked-review-academic-other"),
  linkedReviewMetricALabel: document.getElementById("linked-review-metric-a-label"),
  linkedReviewMetricA: document.getElementById("linked-review-metric-a"),
  linkedReviewMetricBLabel: document.getElementById("linked-review-metric-b-label"),
  linkedReviewMetricB: document.getElementById("linked-review-metric-b"),
  linkedReviewMetricCLabel: document.getElementById("linked-review-metric-c-label"),
  linkedReviewMetricC: document.getElementById("linked-review-metric-c"),
  linkedReviewComment: document.getElementById("linked-review-comment"),
  reviewFeedback: document.getElementById("review-feedback"),
  reviewSubmit: document.getElementById("review-submit"),
  reviewCancelEdit: document.getElementById("review-cancel-edit"),
  authLaunch: document.getElementById("auth-launch"),
  reviewAuthAction: document.getElementById("review-auth-action"),
  reviewSignout: document.getElementById("review-signout"),
  authReviewCopy: document.getElementById("auth-review-copy"),
  authModal: document.getElementById("auth-modal"),
  authModalBackdrop: document.getElementById("auth-modal-backdrop"),
  authClose: document.getElementById("auth-close"),
  authModeSignIn: document.getElementById("auth-mode-signin"),
  authModeSignUp: document.getElementById("auth-mode-signup"),
  authGoogle: document.getElementById("auth-google"),
  authForm: document.getElementById("auth-form"),
  authDisplayNameField: document.getElementById("auth-display-name-field"),
  authDisplayName: document.getElementById("auth-display-name"),
  authUsernameField: document.getElementById("auth-username-field"),
  authUsername: document.getElementById("auth-username"),
  authPhoneField: document.getElementById("auth-phone-field"),
  authPhone: document.getElementById("auth-phone"),
  authEmailField: document.getElementById("auth-email-field"),
  authEmail: document.getElementById("auth-email"),
  authPasswordField: document.getElementById("auth-password-field"),
  authPassword: document.getElementById("auth-password"),
  authHelper: document.getElementById("auth-helper"),
  authFeedback: document.getElementById("auth-feedback"),
  authSubmit: document.getElementById("auth-submit"),
  sourceList: document.getElementById("source-list")
};

function returnToBrowseForDirectoryChange() {
  if (state.view === "detail") {
    openBrowse();
  }
}

function syncSelectionToVisibleResults() {
  const visibleItems = filteredItems();
  if (!visibleItems.length) {
    state.selectedId = null;
    return;
  }
  if (!visibleItems.some((item) => item.id === state.selectedId)) {
    state.selectedId = visibleItems[0].id;
  }
}

function moveDetailViewToVisibleResult() {
  if (state.view !== "detail") {
    return false;
  }
  const visibleItems = filteredItems();
  if (!visibleItems.length) {
    state.selectedId = null;
    openBrowse();
    return true;
  }
  if (!visibleItems.some((item) => item.id === state.selectedId)) {
    state.selectedId = visibleItems[0].id;
  }
  openDetail(state.selectedId);
  return true;
}

function runDirectorySearch() {
  state.search = elements.searchInput.value.trim();
  returnToBrowseForDirectoryChange();
  syncSelectionToVisibleResults();
  renderResults();
  renderDetail();
  trackSearch();
  document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildRatingOptions(select) {
  select.innerHTML = "";
  for (let rating = 10; rating >= 1; rating -= 1) {
    const option = document.createElement("option");
    option.value = String(rating);
    option.textContent = `${rating} / 10`;
    select.appendChild(option);
  }
  select.value = "8";
}

function linkedItemsFor(item) {
  if (!item) {
    return [];
  }
  if (item.type === "course") {
    return item.conveners.map(getItemById).filter(Boolean);
  }
  const explicitLinks = (item.linkedCourses || []).map(getItemById).filter(Boolean);
  if (explicitLinks.length) {
    return explicitLinks;
  }
  return dataset.courses.filter((course) => (course.conveners || []).includes(item.id));
}

function companionItemsFor(item) {
  if (!item) {
    return [];
  }
  return item.type === "course" ? dataset.academics : dataset.courses;
}

function itemDisplayName(item) {
  return item.type === "course" ? `${item.code} - ${item.name}` : item.name;
}

function metricLabelsForReviewElements(item, labels) {
  const [metricA, metricB, metricC] = metricLabelsFor(item);
  labels.metricALabel.textContent = metricA;
  labels.metricBLabel.textContent = metricB;
  labels.metricCLabel.textContent = metricC;
}

function allItems() {
  return [...dataset.courses, ...dataset.academics];
}

function getCollegeForItem(item) {
  const college = `${item.college || ""}`.toLowerCase();
  const schoolCode = `${item.schoolCode || ""}`.toUpperCase();
  const schoolText = `${item.school || ""} ${item.schoolCode || ""}`.toLowerCase();
  if (
    college.includes("science and medicine") ||
    ["PHYS", "CHEM", "BIOL", "SMP", "JCSMR", "RSAA", "RSES", "CSM", "SOMAP"].includes(schoolCode) ||
    schoolText.includes("physics") ||
    schoolText.includes("chemistry") ||
    schoolText.includes("biology") ||
    schoolText.includes("medicine and psychology") ||
    schoolText.includes("medical research") ||
    schoolText.includes("astronomy") ||
    schoolText.includes("earth sciences")
  ) {
    return "csm";
  }
  if (
    college.includes("systems and society") ||
    ["COMP", "CYB", "ENGN", "MSI", "FENS", "CPAS", "CSS", "SOE", "SOC", "FSOEA"].includes(schoolCode) ||
    schoolText.includes("computing") ||
    schoolText.includes("cybernetics") ||
    schoolText.includes("engineering") ||
    schoolText.includes("mathematical sciences") ||
    schoolText.includes("environment and society") ||
    schoolText.includes("public awareness of science")
  ) {
    return "css";
  }
  if (
    college.includes("asia and the pacific") ||
    schoolCode === "CAP" ||
    schoolCode === "BELL" ||
    schoolCode === "CHL" ||
    schoolCode === "CIW" ||
    schoolText.includes("asia pacific") ||
    schoolText.includes("china in the world") ||
    schoolText.includes("culture, history and language")
  ) {
    return "cap";
  }
  if (college.includes("arts") || college.includes("social sciences") || college === "cass") {
    return "cass";
  }
  if (
    schoolCode === "LAW" ||
    schoolCode === "CRAW" ||
    schoolCode === "REGN" ||
    schoolCode === "NSC" ||
    schoolCode === "NCEPH" ||
    college.includes("law, governance and policy") ||
    schoolText.includes("law") ||
    schoolText.includes("crawford") ||
    schoolText.includes("regulation and global governance") ||
    schoolText.includes("national security") ||
    schoolText.includes("epidemiology") ||
    schoolText.includes("population health")
  ) {
    return "law";
  }
  if (schoolCode === "SPIR" || schoolCode === "CASS" || schoolText.includes("politics") || schoolText.includes("international relations")) {
    return "cass";
  }
  return "cbe";
}

function getItemById(itemId) {
  return allItems().find((item) => item.id === itemId);
}

function filteredOnlyCurrentType() {
  return filteredItems().filter((item) => !state.type || item.type === state.type);
}

function getCoursePrefix(item) {
  if (item.type !== "course" || !item.code) {
    return "";
  }
  const match = `${item.code}`.toUpperCase().match(/^[A-Z]+/);
  return match ? match[0] : "";
}

function syncRoute() {
  if (state.view === "detail" && state.selectedId) {
    window.history.replaceState(null, "", `#item=${encodeURIComponent(state.selectedId)}`);
    return;
  }
  window.history.replaceState(null, "", "#directory");
}

function openDetail(itemId) {
  state.selectedId = itemId;
  state.view = "detail";
  syncRoute();
  renderResults();
  renderDetail();
  renderPageState();
  trackCurrentPageView();
}

function openBrowse() {
  state.view = "browse";
  syncRoute();
  renderPageState();
  trackCurrentPageView();
}

function getReviewsForItem(itemId) {
  return [...dataset.seedReviews, ...state.sharedReviews].filter((review) => review.itemId === itemId);
}

function reviewNetVotes(review) {
  return Number(review.upvotes || 0) - Number(review.downvotes || 0);
}

function reviewYear(review) {
  return `${review.takenYear || review.createdAt || ""}`.slice(0, 4);
}

function reviewAcademicLabel(review) {
  return review.academicName || "";
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function normalizeRatingValue(value) {
  const numeric = Number(value || 0);
  if (!numeric) {
    return 0;
  }
  return numeric <= 5 ? numeric * 2 : numeric;
}

function overallFromMetrics(metricA, metricB, metricC) {
  return average([
    normalizeRatingValue(metricA),
    normalizeRatingValue(metricB),
    normalizeRatingValue(metricC)
  ]);
}

function ratingSummary(itemId) {
  const reviews = getReviewsForItem(itemId);
  return {
    count: reviews.length,
    overall: average(reviews.map((review) => overallFromMetrics(review.metricA, review.metricB, review.metricC))),
    metricA: average(reviews.map((review) => normalizeRatingValue(review.metricA))),
    metricB: average(reviews.map((review) => normalizeRatingValue(review.metricB))),
    metricC: average(reviews.map((review) => normalizeRatingValue(review.metricC)))
  };
}

function formatScore(value) {
  return value ? value.toFixed(1) : "0.0";
}

function metricLabelsFor(item) {
  return item.type === "course"
    ? ["Course load", "Assessment design", "How interesting"]
    : ["Clarity", "Support", "Engagement"];
}

function setSemesterVisibility(field, select, item) {
  const isCourse = item?.type === "course";
  field.classList.toggle("is-hidden", !isCourse);
  if (!isCourse) {
    select.value = "";
  }
}

function reviewYearOptions() {
  const currentYear = new Date().getFullYear();
  const years = [];
  for (let year = currentYear; year >= 2015; year -= 1) {
    years.push(String(year));
  }
  return years;
}

function semesterOptions() {
  return ["Summer", "Winter", "Semester 1", "Semester 2"];
}

function populateYearSelect(select, selectedValue = "") {
  const previous = selectedValue || select.value;
  select.innerHTML = "";
  const base = document.createElement("option");
  base.value = "";
  base.textContent = "Choose a year";
  select.appendChild(base);
  reviewYearOptions().forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    select.appendChild(option);
  });
  select.value = reviewYearOptions().includes(previous) ? previous : "";
}

function academicOptionsForCourse(item, searchValue = "") {
  if (!item || item.type !== "course") {
    return [];
  }
  const search = searchValue.trim().toLowerCase();
  if (!search) {
    return [];
  }
  return dataset.academics
    .map((academic) => {
      const haystack = `${academic.name} ${academic.position} ${academic.school} ${academic.college || ""} ${academic.focus || ""}`.toLowerCase();
      const startsWith = haystack.startsWith(search);
      const nameStartsWith = academic.name.toLowerCase().startsWith(search);
      const includes = haystack.includes(search);
      return { academic, startsWith, nameStartsWith, includes };
    })
    .filter((entry) => entry.includes)
    .sort((left, right) => {
      if (left.nameStartsWith !== right.nameStartsWith) {
        return left.nameStartsWith ? -1 : 1;
      }
      if (left.startsWith !== right.startsWith) {
        return left.startsWith ? -1 : 1;
      }
      return left.academic.name.localeCompare(right.academic.name);
    })
    .map((entry) => entry.academic);
}

function populateAcademicSelect(select, searchInput, item, selectedValue = "") {
  const previous = selectedValue || select.value;
  select.innerHTML = "";
  if (!item || item.type !== "course") {
    if (searchInput) {
      searchInput.value = "";
    }
    select.value = "";
    return;
  }
  const candidates = academicOptionsForCourse(item, searchInput?.value || "");
  if (!candidates.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = searchInput?.value?.trim()
      ? "No matches found"
      : "Start typing to search";
    select.appendChild(option);
    select.value = "";
    return;
  }
  const base = document.createElement("option");
  base.value = "";
  base.textContent = "No academic selected";
  select.appendChild(base);
  const other = document.createElement("option");
  other.value = "__other__";
  other.textContent = "Other";
  select.appendChild(other);
  candidates.forEach((academic) => {
    const option = document.createElement("option");
    option.value = academic.id;
    option.textContent = academic.name;
    select.appendChild(option);
  });
  const hasPrevious = previous === "__other__" || candidates.some((academic) => academic.id === previous);
  select.value = hasPrevious ? previous : candidates[0].id;
}

function syncOtherAcademicInput(select, otherInput) {
  const showOther = select.value === "__other__";
  otherInput.classList.toggle("is-hidden", !showOther);
  if (!showOther) {
    otherInput.value = "";
  }
}

function setCourseReviewFields(item, config) {
  const isCourse = item?.type === "course";
  config.yearField.classList.toggle("is-hidden", !isCourse);
  config.academicField.classList.toggle("is-hidden", !isCourse);
  setSemesterVisibility(config.semesterField, config.semesterSelect, item);
  if (!isCourse) {
    if (config.academicSearch) {
      config.academicSearch.value = "";
    }
    if (config.academicOther) {
      config.academicOther.classList.add("is-hidden");
      config.academicOther.value = "";
    }
    config.yearSelect.value = "";
    config.academicSelect.value = "";
    return;
  }
  populateYearSelect(config.yearSelect);
  populateAcademicSelect(config.academicSelect, config.academicSearch, item);
  if (config.academicOther) {
    syncOtherAcademicInput(config.academicSelect, config.academicOther);
  }
}

function updateComputedOverall(output, metricASelect, metricBSelect, metricCSelect) {
  const overall = overallFromMetrics(metricASelect.value, metricBSelect.value, metricCSelect.value);
  output.value = `${formatScore(overall)} / 10`;
}

function updateSyncStatus(message) {
  state.syncState = message;
  elements.syncStatus.textContent = message;
}

function analyticsEnabled() {
  return analytics.ready && typeof window.gtag === "function";
}

function ensureAnalyticsLoaded(measurementId) {
  if (!measurementId || analytics.measurementId === measurementId) {
    return;
  }
  if (!document.getElementById("ga4-loader")) {
    const script = document.createElement("script");
    script.id = "ga4-loader";
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(measurementId)}`;
    document.head.appendChild(script);
  }
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag() {
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  window.gtag("config", measurementId, { send_page_view: false });
  analytics.measurementId = measurementId;
  analytics.ready = true;
}

function currentPagePath() {
  if (state.view === "detail" && state.selectedId) {
    return `/cbe-rating/item/${state.selectedId}`;
  }
  return "/cbe-rating/directory";
}

function currentPageTitle() {
  if (state.view === "detail" && state.selectedId) {
    const item = getItemById(state.selectedId);
    return item ? `ANRevU - ${itemDisplayName(item)}` : "ANRevU";
  }
  return "ANRevU - Directory";
}

function trackCurrentPageView(force = false) {
  if (!analyticsEnabled()) {
    return;
  }
  const pagePath = currentPagePath();
  if (!force && analytics.lastPagePath === pagePath) {
    return;
  }
  window.gtag("event", "page_view", {
    page_title: currentPageTitle(),
    page_path: pagePath,
    page_location: `${window.location.origin}${window.location.pathname}${window.location.hash || ""}`
  });
  analytics.lastPagePath = pagePath;
}

function trackSearch() {
  if (!analyticsEnabled()) {
    return;
  }
  window.gtag("event", "search", {
    item_type: state.type || "all",
    college: state.college,
    query_length: state.search.length
  });
}

function trackReviewSubmit(item, hasLinkedReview) {
  if (!analyticsEnabled() || !item) {
    return;
  }
  window.gtag("event", "anrevu_review_submit", {
    item_type: item.type,
    college: getCollegeForItem(item),
    has_linked_review: hasLinkedReview ? "yes" : "no"
  });
}

async function fetchPublicConfig() {
  const response = await fetch("/api/anreview/public-config");
  if (!response.ok) {
    throw new Error("Unable to load public site configuration.");
  }
  return response.json();
}

function delay(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function mergeOfficialAcademics(officialAcademics) {
  const existingById = new Map(dataset.academics.map((academic) => [academic.id, academic]));
  const merged = officialAcademics.map((academic) => {
    const existing = existingById.get(academic.id) || {};
    return {
      ...existing,
      ...academic,
      tags: academic.tags?.length ? academic.tags : existing.tags || [],
      linkedCourses: existing.linkedCourses || academic.linkedCourses || [],
      reviewMetrics: existing.reviewMetrics || academic.reviewMetrics || ["Clarity", "Support", "Engagement"]
    };
  });
  const seen = new Set(merged.map((academic) => academic.id));
  dataset.academics = [
    ...merged,
    ...dataset.academics.filter((academic) => !seen.has(academic.id))
  ];
}

function mergeOfficialCourses(officialCourses) {
  const existingById = new Map(dataset.courses.map((course) => [course.id, course]));
  const merged = officialCourses.map((course) => {
    const existing = existingById.get(course.id) || {};
    return {
      ...existing,
      ...course,
      tags: course.tags?.length ? course.tags : existing.tags || [],
      terms: course.terms?.length ? course.terms : existing.terms || [],
      reviewMetrics: existing.reviewMetrics || course.reviewMetrics || ["Teaching quality", "Assessment design", "How interesting"]
    };
  });
  const seen = new Set(merged.map((course) => course.id));
  dataset.courses = [
    ...merged,
    ...dataset.courses.filter((course) => !seen.has(course.id))
  ];
}

function announceBundledCatalog() {
  updateSyncStatus("");
}

async function fetchSharedReviews() {
  const response = await fetch("/api/anreview/reviews");
  if (!response.ok) {
    throw new Error("Unable to reach ANReview review storage.");
  }
  const payload = await response.json();
  state.sharedReviews = payload.reviews || [];
  state.reportCount = payload.reportCount || 0;
  elements.moderationCount.textContent = String(state.reportCount);
}

function populateSchoolFilter() {
  const isCourseMode = state.type === "course";
  const optionLabel = isCourseMode ? "Course code letters" : "School";
  const baseLabel = isCourseMode ? "All course code letters" : "All schools";
  const options = [...new Set(
    allItems()
      .filter((item) => state.college === "all" || getCollegeForItem(item) === state.college)
      .filter((item) => !state.type || item.type === state.type)
      .filter((item) => state.level === "all" || !item.level || item.level === state.level)
      .map((item) => (isCourseMode ? getCoursePrefix(item) : item.school))
      .filter(Boolean)
  )].sort((a, b) => a.localeCompare(b));
  elements.contextFilterLabel.textContent = optionLabel;
  elements.schoolFilter.innerHTML = "";
  const base = document.createElement("option");
  base.value = "all";
  base.textContent = baseLabel;
  elements.schoolFilter.appendChild(base);
  options.forEach((optionValue) => {
    const option = document.createElement("option");
    option.value = optionValue;
    option.textContent = optionValue;
    elements.schoolFilter.appendChild(option);
  });
  if (![...elements.schoolFilter.options].some((option) => option.value === state.school)) {
    state.school = "all";
  }
  elements.schoolFilter.value = state.school;
}

function renderPageState() {
  const showingDetail = state.view === "detail" && !!getItemById(state.selectedId);
  elements.browseView.classList.toggle("is-hidden", showingDetail);
  elements.detailPage.classList.toggle("is-hidden", !showingDetail);
}

function filteredItems() {
  return allItems()
    .filter((item) => {
      if (state.college !== "all" && getCollegeForItem(item) !== state.college) {
        return false;
      }
      if (state.type && item.type !== state.type) {
        return false;
      }
      if (state.school !== "all") {
        if (item.type === "course") {
          if (getCoursePrefix(item) !== state.school) {
            return false;
          }
        } else if (item.school !== state.school) {
          return false;
        }
      }
      if (state.level !== "all" && item.level && item.level !== state.level) {
        return false;
      }
      if (!state.search.trim()) {
        return true;
      }

      const haystack = [
        item.name,
        item.code,
        item.school,
        item.position,
        item.focus,
        item.summary,
        ...(item.tags || [])
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(state.search.toLowerCase());
    })
    .sort((left, right) => {
      if (state.sort === "name") {
        return (left.code || left.name).localeCompare(right.code || right.name);
      }
      if (state.sort === "reviews") {
        return ratingSummary(right.id).count - ratingSummary(left.id).count;
      }

      const ratingGap = ratingSummary(right.id).overall - ratingSummary(left.id).overall;
      if (ratingGap !== 0) {
        return ratingGap;
      }
      return ratingSummary(right.id).count - ratingSummary(left.id).count;
    });
}

function syncCollegeTabs() {
  elements.allCollegesTab.classList.toggle("is-active", state.college === "all");
  elements.cbeTab.classList.toggle("is-active", state.college === "cbe");
  elements.lawTab.classList.toggle("is-active", state.college === "law");
  elements.cassTab.classList.toggle("is-active", state.college === "cass");
  elements.capTab.classList.toggle("is-active", state.college === "cap");
  elements.csmTab.classList.toggle("is-active", state.college === "csm");
  elements.cssTab.classList.toggle("is-active", state.college === "css");
}

function syncTypeTabs() {
  elements.coursesTab.classList.toggle("is-active", state.type === "course");
  elements.professorsTab.classList.toggle("is-active", state.type === "academic");
}

function createChip(text, className = "meta-chip") {
  const chip = document.createElement("span");
  chip.className = className;
  chip.textContent = text;
  return chip;
}

function renderResults() {
  const items = filteredItems();
  elements.resultsGrid.innerHTML = "";
  elements.resultsMeta.textContent = `${items.length} item${items.length === 1 ? "" : "s"} found`;

  if (!items.length) {
    const empty = document.createElement("article");
    empty.className = "result-card";
    empty.innerHTML = "<h4>No matches yet</h4><p class='result-snippet'>Try a broader search or reset a filter.</p>";
    elements.resultsGrid.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const summary = ratingSummary(item.id);
    const card = document.createElement("article");
    card.className = `result-card${item.id === state.selectedId ? " is-active" : ""}`;

    const topMeta = document.createElement("div");
    topMeta.className = "result-meta";
    topMeta.append(
      createChip(item.type === "course" ? "Course" : "Academic", "score-badge"),
      createChip(item.schoolCode || item.school),
      createChip(item.level === "PGRD" ? "Postgrad" : item.level === "UGRD" ? "Undergrad" : item.position || "CBE")
    );

    const title = document.createElement("h4");
    title.textContent = item.type === "course" ? `${item.code} - ${item.name}` : item.name;

    const subtitle = document.createElement("p");
    subtitle.className = "result-snippet";
    subtitle.textContent = item.type === "course" ? item.summary : item.focus;

    const tagRow = document.createElement("div");
    tagRow.className = "result-tags";
    tagRow.append(
      createChip(`${formatScore(summary.overall)} overall`, "score-badge"),
      createChip(`${summary.count} review${summary.count === 1 ? "" : "s"}`),
      ...(item.tags || []).slice(0, 3).map((tag) => createChip(tag, "tag-chip"))
    );

    card.append(topMeta, title, subtitle, tagRow);
    card.addEventListener("click", () => {
      openDetail(item.id);
    });

    elements.resultsGrid.appendChild(card);
  });
}

function factRow(label, value) {
  const term = document.createElement("dt");
  term.textContent = label;
  const description = document.createElement("dd");
  if (value instanceof HTMLElement) {
    description.appendChild(value);
  } else {
    description.textContent = value;
  }
  return [term, description];
}

function setMetricCopy(item) {
  const [metricA, metricB, metricC] = metricLabelsFor(item);
  elements.metricALabel.textContent = metricA;
  elements.metricBLabel.textContent = metricB;
  elements.metricCLabel.textContent = metricC;
  metricLabelsForReviewElements(item, {
    metricALabel: elements.reviewMetricALabel,
    metricBLabel: elements.reviewMetricBLabel,
    metricCLabel: elements.reviewMetricCLabel
  });
  elements.reviewPanelSubtitle.textContent = itemDisplayName(item);
  setCourseReviewFields(item, {
    semesterField: elements.reviewSemesterField,
    semesterSelect: elements.reviewSemester,
    yearField: elements.reviewYearField,
    yearSelect: elements.reviewYear,
    academicField: elements.reviewAcademicField,
    academicSearch: elements.reviewAcademicSearch,
    academicSelect: elements.reviewAcademic,
    academicOther: elements.reviewAcademicOther
  });
  updateComputedOverall(
    elements.reviewOverall,
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC
  );
}

function resetLinkedReviewPanel() {
  elements.linkedReviewEnabled.checked = false;
  elements.linkedReviewToggleWrap.classList.remove("is-hidden");
  elements.linkedReviewPanel.classList.add("is-hidden");
  elements.linkedReviewHint.textContent = "";
  elements.linkedReviewSearch.value = "";
  elements.linkedReviewTarget.innerHTML = "";
  elements.linkedReviewComment.value = "";
  elements.linkedReviewSemester.value = "";
  elements.linkedReviewYear.value = "";
  elements.linkedReviewAcademicSearch.value = "";
  elements.linkedReviewAcademic.value = "";
  elements.linkedReviewAcademicOther.value = "";
  elements.linkedReviewAcademicOther.classList.add("is-hidden");
  elements.linkedReviewSemesterField.classList.add("is-hidden");
  elements.linkedReviewYearField.classList.add("is-hidden");
  elements.linkedReviewAcademicField.classList.add("is-hidden");
  updateComputedOverall(
    elements.linkedReviewOverall,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  );
}

function filteredCompanionItems(item) {
  const search = elements.linkedReviewSearch.value.trim().toLowerCase();
  if (!search) {
    return [];
  }

  const source = companionItemsFor(item);
  const matches = source
    .map((candidate) => {
      const haystack = candidate.type === "course"
        ? `${candidate.code} ${candidate.name} ${candidate.school} ${candidate.college || ""}`.toLowerCase()
        : `${candidate.name} ${candidate.position} ${candidate.school} ${candidate.college || ""} ${candidate.focus || ""}`.toLowerCase();
      const startsWith = haystack.startsWith(search);
      const nameStartsWith = `${candidate.name || candidate.code || ""}`.toLowerCase().startsWith(search);
      const includes = haystack.includes(search);
      return { candidate, startsWith, nameStartsWith, includes };
    })
    .filter((entry) => entry.includes)
    .sort((left, right) => {
      if (left.nameStartsWith !== right.nameStartsWith) {
        return left.nameStartsWith ? -1 : 1;
      }
      if (left.startsWith !== right.startsWith) {
        return left.startsWith ? -1 : 1;
      }
      return itemDisplayName(left.candidate).localeCompare(itemDisplayName(right.candidate));
    })
    .map((entry) => entry.candidate);
  return matches;
}

function populateLinkedReviewTargets(item) {
  const currentValue = elements.linkedReviewTarget.value;
  const candidates = filteredCompanionItems(item);
  elements.linkedReviewTarget.innerHTML = "";

  if (!candidates.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = elements.linkedReviewSearch.value.trim()
      ? "No matches found"
      : "Start typing to search";
    elements.linkedReviewTarget.appendChild(option);
    elements.linkedReviewTarget.value = "";
    return [];
  }

  candidates.forEach((candidate) => {
    const option = document.createElement("option");
    option.value = candidate.id;
    option.textContent = itemDisplayName(candidate);
    elements.linkedReviewTarget.appendChild(option);
  });

  elements.linkedReviewTarget.value = candidates.some((candidate) => candidate.id === currentValue)
    ? currentValue
    : candidates[0].id;
  return candidates;
}

function syncLinkedReviewPanel() {
  const item = getItemById(state.selectedId);
  const availableTargets = populateLinkedReviewTargets(item);
  const activeTarget = availableTargets.find((candidate) => candidate.id === elements.linkedReviewTarget.value);
  const shouldShow = Boolean(item && elements.linkedReviewEnabled.checked);

  elements.linkedReviewPanel.classList.toggle("is-hidden", !shouldShow);
  if (!shouldShow) {
    return;
  }

  if (!activeTarget) {
    elements.linkedReviewTitle.textContent = item.type === "course" ? "Additional academic review" : "Additional course review";
    elements.linkedReviewSubtitle.textContent = "No matching result yet. Keep typing to find the right item.";
    setCourseReviewFields(null, {
      semesterField: elements.linkedReviewSemesterField,
      semesterSelect: elements.linkedReviewSemester,
      yearField: elements.linkedReviewYearField,
      yearSelect: elements.linkedReviewYear,
      academicField: elements.linkedReviewAcademicField,
      academicSearch: elements.linkedReviewAcademicSearch,
      academicSelect: elements.linkedReviewAcademic,
      academicOther: elements.linkedReviewAcademicOther
    });
    return;
  }

  elements.linkedReviewTitle.textContent = activeTarget.type === "course" ? "Additional course review" : "Additional academic review";
  elements.linkedReviewSubtitle.textContent = itemDisplayName(activeTarget);
  metricLabelsForReviewElements(activeTarget, {
    metricALabel: elements.linkedReviewMetricALabel,
    metricBLabel: elements.linkedReviewMetricBLabel,
    metricCLabel: elements.linkedReviewMetricCLabel
  });
  setCourseReviewFields(activeTarget, {
    semesterField: elements.linkedReviewSemesterField,
    semesterSelect: elements.linkedReviewSemester,
    yearField: elements.linkedReviewYearField,
    yearSelect: elements.linkedReviewYear,
    academicField: elements.linkedReviewAcademicField,
    academicSearch: elements.linkedReviewAcademicSearch,
    academicSelect: elements.linkedReviewAcademic,
    academicOther: elements.linkedReviewAcademicOther
  });
  updateComputedOverall(
    elements.linkedReviewOverall,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  );
}

function configureLinkedReviewPanel(item) {
  resetLinkedReviewPanel();
  if (!item) {
    elements.linkedReviewToggleWrap.classList.add("is-hidden");
    return;
  }

  elements.linkedReviewToggleCopy.textContent =
    item.type === "course"
      ? "Rate the academic at the same time"
      : "Rate the course at the same time";
  elements.linkedReviewToggleSubcopy.textContent =
    item.type === "course"
      ? "Tick this to open a searchable academic review beside the course review."
      : "Tick this to open a searchable course review beside the academic review.";
  elements.linkedReviewSearchLabel.textContent = item.type === "course" ? "Search academic" : "Search course";
  elements.linkedReviewSearch.placeholder =
    item.type === "course"
      ? "Start typing an academic name"
      : "Start typing a course code or title";
  elements.linkedReviewTargetLabel.textContent = item.type === "course" ? "Academic" : "Course";

  elements.linkedReviewHint.textContent =
    item.type === "course"
      ? "Tick this to open a search panel and rate any academic in the ANRevU sample alongside the course."
      : "Tick this to open a search panel and rate any course in the ANRevU sample alongside the academic.";
  populateLinkedReviewTargets(item);
}

function renderFacts(item) {
  elements.detailFacts.innerHTML = "";
  const facts = [];

  if (item.type === "course") {
    facts.push(["Code", item.code]);
    facts.push(["School", item.school]);
    facts.push(["Level", item.level === "UGRD" ? "Undergraduate" : "Postgraduate"]);
    facts.push(["Terms", item.terms.join(", ")]);
    facts.push(["Summary", item.summary]);
  } else {
    facts.push(["Position", item.position]);
    facts.push(["School", item.school]);
    facts.push(["Focus", item.focus]);
    facts.push(["Email", item.email]);
    facts.push(["Office", item.office]);
  }

  const officialLink = document.createElement("a");
  officialLink.href = item.handbookUrl || item.profileUrl;
  officialLink.target = "_blank";
  officialLink.rel = "noreferrer";
  officialLink.textContent = item.type === "course" ? "Open ANU course page" : "Open ANU staff profile";
  facts.push(["Official page", officialLink]);

  facts.flatMap(([label, value]) => factRow(label, value)).forEach((node) => {
    elements.detailFacts.appendChild(node);
  });
}

async function reportReview(review, triggerButton) {
  triggerButton.disabled = true;
  try {
    const response = await fetch("/api/anreview/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId: review.id,
        itemId: review.itemId,
        reason: "User flagged review for moderator review"
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Unable to submit report.");
    }

    state.reportCount += 1;
    elements.moderationCount.textContent = String(state.reportCount);
    updateFeedback("Report submitted successfully. This review is now flagged for moderator review.");
    triggerButton.textContent = "Reported";
  } catch (error) {
    updateFeedback(error.message || "Unable to report review right now.", true);
    triggerButton.disabled = false;
  }
}

function voteCounts(review) {
  return {
    upvotes: Number(review.upvotes || 0),
    downvotes: Number(review.downvotes || 0)
  };
}

function populateReviewFilterOptions(reviews) {
  const semesterValues = semesterOptions();
  const reviewYearValues = [...new Set(reviews.map((review) => reviewYear(review)).filter(Boolean))].sort((left, right) => right.localeCompare(left));
  const yearValues = [...new Set([...reviewYearOptions(), ...reviewYearValues])].sort((left, right) => right.localeCompare(left));

  const previousSemester = state.reviewSemester;
  const previousYear = state.reviewYear;

  elements.reviewSemesterFilter.innerHTML = "";
  elements.reviewYearFilter.innerHTML = "";

  const baseSemester = document.createElement("option");
  baseSemester.value = "all";
  baseSemester.textContent = "All semesters";
  elements.reviewSemesterFilter.appendChild(baseSemester);
  semesterValues.forEach((semester) => {
    const option = document.createElement("option");
    option.value = semester;
    option.textContent = semester;
    elements.reviewSemesterFilter.appendChild(option);
  });

  const unknownSemesterCount = reviews.filter((review) => !review.semester).length;
  if (unknownSemesterCount) {
    const option = document.createElement("option");
    option.value = "unknown";
    option.textContent = "Unknown / not given";
    elements.reviewSemesterFilter.appendChild(option);
  }

  const baseYear = document.createElement("option");
  baseYear.value = "all";
  baseYear.textContent = "All years";
  elements.reviewYearFilter.appendChild(baseYear);
  yearValues.forEach((year) => {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    elements.reviewYearFilter.appendChild(option);
  });
  const unknownYearCount = reviews.filter((review) => !reviewYear(review)).length;
  if (unknownYearCount) {
    const option = document.createElement("option");
    option.value = "unknown";
    option.textContent = "Unknown / not given";
    elements.reviewYearFilter.appendChild(option);
  }

  state.reviewSemester = [...semesterValues, "all", ...(unknownSemesterCount ? ["unknown"] : [])].includes(previousSemester)
    ? previousSemester
    : "all";
  state.reviewYear = [...yearValues, "all", ...(unknownYearCount ? ["unknown"] : [])].includes(previousYear) ? previousYear : "all";

  elements.reviewSemesterFilter.value = state.reviewSemester;
  elements.reviewYearFilter.value = state.reviewYear;
  elements.reviewSortFilter.value = state.reviewSort;
}

function filteredReviewsForItem(itemId) {
  return getReviewsForItem(itemId).filter((review) => {
    if (state.reviewSemester === "unknown" && review.semester) {
      return false;
    }
    if (state.reviewSemester !== "all" && state.reviewSemester !== "unknown" && review.semester !== state.reviewSemester) {
      return false;
    }
    if (state.reviewYear === "unknown" && reviewYear(review)) {
      return false;
    }
    if (state.reviewYear !== "all" && state.reviewYear !== "unknown" && reviewYear(review) !== state.reviewYear) {
      return false;
    }
    return true;
  });
}

function sortReviews(reviews) {
  return reviews.slice().sort((left, right) => {
    if (state.reviewSort === "recent") {
      return `${right.createdAt}`.localeCompare(`${left.createdAt}`);
    }
    if (state.reviewSort === "oldest") {
      return `${left.createdAt}`.localeCompare(`${right.createdAt}`);
    }
    if (state.reviewSort === "rating-high") {
      const ratingGap = overallFromMetrics(right.metricA, right.metricB, right.metricC) - overallFromMetrics(left.metricA, left.metricB, left.metricC);
      if (ratingGap !== 0) {
        return ratingGap;
      }
    } else if (state.reviewSort === "rating-low") {
      const ratingGap = overallFromMetrics(left.metricA, left.metricB, left.metricC) - overallFromMetrics(right.metricA, right.metricB, right.metricC);
      if (ratingGap !== 0) {
        return ratingGap;
      }
    } else {
      const netGap = reviewNetVotes(right) - reviewNetVotes(left);
      if (netGap !== 0) {
        return netGap;
      }
    }
    const upvoteGap = Number(right.upvotes || 0) - Number(left.upvotes || 0);
    if (upvoteGap !== 0) {
      return upvoteGap;
    }
    return `${right.createdAt}`.localeCompare(`${left.createdAt}`);
  });
}

async function voteReview(review, direction, triggerButton) {
  const previousText = triggerButton.textContent;
  triggerButton.disabled = true;
  try {
    const response = await fetch("/api/anreview/reviews/vote", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        reviewId: review.id,
        direction
      })
    });

    const raw = await response.text();
    const payload = raw ? JSON.parse(raw) : {};
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Unable to save vote.");
    }

    const updatedReview = payload.review || {};
    const target = [...dataset.seedReviews, ...state.sharedReviews].find((entry) => entry.id === review.id);
    if (target) {
      target.upvotes = Number(updatedReview.upvotes || 0);
      target.downvotes = Number(updatedReview.downvotes || 0);
    }
    renderReviews(getItemById(state.selectedId));
  } catch (error) {
    updateFeedback(error.message || "Unable to save vote right now.", true);
    triggerButton.disabled = false;
    triggerButton.textContent = previousText;
  }
}

function renderReviews(item) {
  const allReviews = getReviewsForItem(item.id);
  populateReviewFilterOptions(allReviews);
  const reviews = sortReviews(filteredReviewsForItem(item.id));
  elements.reviewList.innerHTML = "";
  elements.reviewSummary.textContent =
    reviews.length === allReviews.length
      ? `${reviews.length} review${reviews.length === 1 ? "" : "s"} on this item`
      : `${reviews.length} of ${allReviews.length} reviews shown`;

  if (!reviews.length) {
    const empty = document.createElement("p");
    empty.className = "result-snippet";
    empty.textContent = "No reviews yet. Be the first person to add one.";
    elements.reviewList.appendChild(empty);
    return;
  }

  reviews.forEach((review) => {
    const card = document.createElement("article");
    card.className = "review-card";

    const meta = document.createElement("div");
    meta.className = "review-meta";
    meta.append(
      createChip(review.author || "Anonymous"),
      createChip(`${formatScore(overallFromMetrics(review.metricA, review.metricB, review.metricC))} overall`, "score-badge"),
      createChip(review.createdAt)
    );
    if (review.isAnuVerified) {
      meta.append(createChip("Verified ANU", "tag-chip"));
    }
    if (review.semester) {
      meta.append(createChip(review.semester, "tag-chip"));
    }
    if (review.takenYear) {
      meta.append(createChip(review.takenYear, "tag-chip"));
    }
    if (reviewAcademicLabel(review)) {
      meta.append(createChip(`Academic: ${reviewAcademicLabel(review)}`, "tag-chip"));
    }

    const metricRow = document.createElement("div");
    metricRow.className = "result-tags";
    const [metricA, metricB, metricC] = metricLabelsFor(item);
    [metricA, metricB, metricC].forEach((label, index) => {
      const values = [review.metricA, review.metricB, review.metricC];
      metricRow.append(createChip(`${label}: ${formatScore(normalizeRatingValue(values[index]))}/10`, "tag-chip"));
    });

    const quote = document.createElement("blockquote");
    quote.textContent = review.comment;

    const footer = document.createElement("div");
    footer.className = "review-actions";
    const voteBar = document.createElement("div");
    voteBar.className = "review-vote-bar";
    const actionBar = document.createElement("div");
    actionBar.className = "review-owner-bar";
    const counts = voteCounts(review);

    const upvoteButton = document.createElement("button");
    upvoteButton.type = "button";
    upvoteButton.className = "vote-button";
    upvoteButton.textContent = `Upvote ${counts.upvotes}`;
    upvoteButton.addEventListener("click", () => {
      voteReview(review, "up", upvoteButton);
    });

    const downvoteButton = document.createElement("button");
    downvoteButton.type = "button";
    downvoteButton.className = "vote-button vote-button--down";
    downvoteButton.textContent = `Downvote ${counts.downvotes}`;
    downvoteButton.addEventListener("click", () => {
      voteReview(review, "down", downvoteButton);
    });

    voteBar.append(upvoteButton, downvoteButton);

    const reportButton = document.createElement("button");
    reportButton.type = "button";
    reportButton.className = "report-button";
    reportButton.textContent = "Report";
    reportButton.addEventListener("click", () => {
      reportReview(review, reportButton);
    });

    if (reviewBelongsToCurrentUser(review)) {
      const editButton = document.createElement("button");
      editButton.type = "button";
      editButton.className = "report-button";
      editButton.textContent = "Edit";
      editButton.addEventListener("click", () => {
        enterEditMode(review);
      });
      actionBar.appendChild(editButton);
    }

    actionBar.appendChild(reportButton);
    footer.append(voteBar, actionBar);
    card.append(meta, metricRow, quote, footer);
    elements.reviewList.appendChild(card);
  });
}

function renderDetail() {
  const item = getItemById(state.selectedId);
  if (!item) {
    elements.detailEmpty.classList.remove("is-hidden");
    elements.detailView.classList.add("is-hidden");
    return;
  }

  const summary = ratingSummary(item.id);
  setMetricCopy(item);
  elements.detailEmpty.classList.add("is-hidden");
  elements.detailView.classList.remove("is-hidden");
  elements.detailType.textContent = item.type === "course" ? "Course" : "Academic";
  elements.detailTitle.textContent = item.type === "course" ? `${item.code} - ${item.name}` : item.name;
  elements.detailSubtitle.textContent =
    item.type === "course"
      ? `${item.school} - ${item.level === "UGRD" ? "Undergraduate" : "Postgraduate"}`
      : `${item.position} - ${item.school}`;
  elements.detailScore.textContent = formatScore(summary.overall);
  elements.metricOverall.textContent = formatScore(summary.overall);
  elements.metricA.textContent = formatScore(summary.metricA);
  elements.metricB.textContent = formatScore(summary.metricB);
  elements.metricC.textContent = formatScore(summary.metricC);

  renderFacts(item);
  renderReviews(item);
  configureLinkedReviewPanel(item);
  const items = filteredOnlyCurrentType();
  const index = items.findIndex((entry) => entry.id === item.id);
  elements.prevItem.disabled = index <= 0;
  elements.nextItem.disabled = index === -1 || index >= items.length - 1;
}

function updateCounts() {
  const visibleItems = allItems().filter((item) => state.college === "all" || getCollegeForItem(item) === state.college);
  const visibleCourses = visibleItems.filter((item) => item.type === "course");
  const visibleAcademics = visibleItems.filter((item) => item.type === "academic");
  const visibleIds = new Set(visibleItems.map((item) => item.id));
  const reviewCount = [...dataset.seedReviews, ...state.sharedReviews].filter((review) => visibleIds.has(review.itemId)).length;
  elements.courseCount.textContent = String(visibleCourses.length);
  elements.staffCount.textContent = String(visibleAcademics.length);
  elements.reviewCount.textContent = String(reviewCount);
  elements.moderationCount.textContent = String(state.reportCount);
}

function renderSources() {
  if (!elements.sourceList) {
    return;
  }
  elements.sourceList.innerHTML = "";
  dataset.sources.forEach((source) => {
    const entry = document.createElement("li");
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = source.label;
    entry.appendChild(link);
    elements.sourceList.appendChild(entry);
  });
}

function authHeaders() {
  if (authState.session?.access_token) {
    return {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authState.session.access_token}`
    };
  }
  return { "Content-Type": "application/json" };
}

function isLoggedIn() {
  return Boolean(authState.user && authState.session);
}

function currentAuthorLabel() {
  if (!isLoggedIn()) {
    return "Anonymous";
  }
  return authState.profile?.author || authState.profile?.username || authState.profile?.displayName || authState.user.email || "Signed-in user";
}

function updateAuthFeedback(message, isError = false) {
  elements.authFeedback.textContent = message;
  elements.authFeedback.classList.remove("is-hidden", "is-error", "is-success");
  elements.authFeedback.classList.add(isError ? "is-error" : "is-success");
}

function clearAuthFeedback() {
  elements.authFeedback.textContent = "";
  elements.authFeedback.classList.add("is-hidden");
  elements.authFeedback.classList.remove("is-error", "is-success");
}

function syncAuthMode() {
  const signingUp = state.authMode === "signup";
  const managingProfile = signingUp && isLoggedIn();
  elements.authModeSignUp.textContent = isLoggedIn() ? "Profile" : "Create account";
  elements.authModeSignIn.classList.toggle("is-active", !signingUp);
  elements.authModeSignUp.classList.toggle("is-active", signingUp);
  elements.authDisplayNameField.classList.toggle("is-hidden", !signingUp);
  elements.authUsernameField.classList.toggle("is-hidden", !signingUp);
  elements.authPhoneField.classList.toggle("is-hidden", !signingUp);
  elements.authEmailField.classList.toggle("is-hidden", managingProfile);
  elements.authPasswordField.classList.toggle("is-hidden", managingProfile);
  elements.authEmail.required = !managingProfile;
  elements.authPassword.required = !managingProfile;
  elements.authSubmit.textContent = managingProfile ? "Save profile" : signingUp ? "Create account" : "Sign in";
  elements.authHelper.innerHTML = signingUp
    ? "Best option: use an <code>@anu.edu.au</code> email so your reviews can show the <strong>Verified ANU</strong> tick."
    : "Use the same email you used to sign up. Google sign-in works too, and <code>@anu.edu.au</code> accounts receive the Verified ANU tick.";
}

function openAuthModal(mode = state.authMode) {
  state.authMode = mode;
  syncAuthMode();
  clearAuthFeedback();
  document.getElementById("auth-modal-title").textContent =
    isLoggedIn() && state.authMode === "signup"
      ? "Manage your review profile"
      : "Sign in or create an account";
  elements.authDisplayName.value = authState.profile?.displayName || "";
  elements.authUsername.value = authState.profile?.username || "";
  elements.authPhone.value = authState.profile?.phone || "";
  elements.authEmail.value = authState.user?.email || "";
  elements.authPassword.value = "";
  elements.authModal.classList.remove("is-hidden");
  elements.authModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (state.authMode === "signup") {
    elements.authDisplayName.focus();
  } else {
    elements.authEmail.focus();
  }
}

function closeAuthModal() {
  elements.authModal.classList.add("is-hidden");
  elements.authModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
}

async function fetchAuthProfile() {
  const response = await fetch("/api/anreview/profile", {
    headers: {
      Authorization: `Bearer ${authState.session.access_token}`
    }
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Unable to load your profile.");
  }
  authState.profile = payload.profile;
  return payload.profile;
}

async function saveAuthProfile(profilePayload) {
  const response = await fetch("/api/anreview/profile", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(profilePayload)
  });
  const payload = await response.json();
  if (!response.ok || !payload.ok) {
    throw new Error(payload.error || "Unable to save your profile.");
  }
  authState.profile = payload.profile;
  return payload.profile;
}

function reviewBelongsToCurrentUser(review) {
  return Boolean(isLoggedIn() && review.userId && authState.user?.id === review.userId);
}

function syncReviewIdentity() {
  const loggedIn = isLoggedIn();
  const authorLabel = currentAuthorLabel();
  elements.reviewAuthor.disabled = loggedIn;
  elements.reviewAuthor.value = loggedIn ? authorLabel : "";
  elements.reviewAuthor.placeholder = loggedIn ? authorLabel : "Anonymous";
  elements.reviewAuthAction.textContent = loggedIn ? "Manage profile" : "Sign in";
  elements.reviewSignout.classList.toggle("is-hidden", !loggedIn);
  elements.authLaunch.textContent = loggedIn ? "My account" : "Sign in";
  if (loggedIn) {
    const verified = authState.profile?.isAnuVerified ? " You have the Verified ANU tick." : " Switch to an @anu.edu.au email if you want the Verified ANU tick beside your reviews.";
    elements.authReviewCopy.textContent = `${authorLabel} is signed in. Reviews posted now can be edited later.${verified}`;
  } else {
    elements.authReviewCopy.textContent = "Sign in to attach your profile, unlock the Verified ANU tick with an @anu.edu.au email, and edit your own reviews later.";
  }
}

function exitEditMode() {
  state.editingReviewId = null;
  elements.reviewCancelEdit.classList.add("is-hidden");
  elements.reviewSubmit.textContent = "Publish review";
  elements.reviewForm.reset();
  [
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  ].forEach(buildRatingOptions);
  updateComputedOverall(
    elements.reviewOverall,
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC
  );
  updateComputedOverall(
    elements.linkedReviewOverall,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  );
  syncReviewIdentity();
  resetLinkedReviewPanel();
  const item = getItemById(state.selectedId);
  if (item) {
    setMetricCopy(item);
    configureLinkedReviewPanel(item);
  }
}

function enterEditMode(review) {
  state.editingReviewId = review.id;
  elements.reviewCancelEdit.classList.remove("is-hidden");
  elements.reviewSubmit.textContent = "Save changes";
  elements.linkedReviewEnabled.checked = false;
  syncLinkedReviewPanel();
  elements.reviewAuthor.value = review.author || currentAuthorLabel();
  elements.reviewMetricA.value = String(Math.round(Number(review.metricA || 8)));
  elements.reviewMetricB.value = String(Math.round(Number(review.metricB || 8)));
  elements.reviewMetricC.value = String(Math.round(Number(review.metricC || 8)));
  updateComputedOverall(
    elements.reviewOverall,
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC
  );
  elements.reviewSemester.value = review.semester || "";
  elements.reviewYear.value = review.takenYear || "";
  if (review.academicId) {
    elements.reviewAcademicSearch.value = review.academicName || "";
    populateAcademicSelect(elements.reviewAcademic, elements.reviewAcademicSearch, getItemById(state.selectedId), review.academicId);
  } else if (review.academicName) {
    elements.reviewAcademicSearch.value = review.academicName;
    populateAcademicSelect(elements.reviewAcademic, elements.reviewAcademicSearch, getItemById(state.selectedId), "__other__");
    elements.reviewAcademicOther.value = review.academicName;
  }
  syncOtherAcademicInput(elements.reviewAcademic, elements.reviewAcademicOther);
  elements.reviewComment.value = review.comment || "";
  updateFeedback("Edit mode is on. Save changes when you're ready.");
  elements.reviewForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

function updateFeedback(message, isError = false) {
  elements.reviewFeedback.textContent = message;
  elements.reviewFeedback.classList.remove("is-hidden", "is-error", "is-success");
  elements.reviewFeedback.classList.add(isError ? "is-error" : "is-success");
  elements.reviewFeedback.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function submitReviewPayload(payload) {
  const response = await fetch("/api/anreview/reviews", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload)
  });

  const raw = await response.text();
  let result = {};
  if (raw) {
    try {
      result = JSON.parse(raw);
    } catch {
      throw new Error(raw.trim() || "Unable to save review.");
    }
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Unable to save review.");
  }
  return result.review;
}

async function updateReviewPayload(reviewId, payload) {
  const response = await fetch("/api/anreview/reviews/update", {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify({
      ...payload,
      reviewId
    })
  });

  const raw = await response.text();
  let result = {};
  if (raw) {
    try {
      result = JSON.parse(raw);
    } catch {
      throw new Error(raw.trim() || "Unable to update review.");
    }
  }
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Unable to update review.");
  }
  return result.review;
}

async function handleReviewSubmit(event) {
  event.preventDefault();

  const item = getItemById(state.selectedId);
  if (!item) {
    updateFeedback("Choose a course or academic before posting a review.", true);
    return;
  }

  const comment = elements.reviewComment.value.trim();
  const linkedTarget = getItemById(elements.linkedReviewTarget.value);
  const saveLinkedReview = Boolean(
    elements.linkedReviewEnabled.checked &&
    !elements.linkedReviewPanel.classList.contains("is-hidden")
  );
  if (saveLinkedReview && !linkedTarget) {
    updateFeedback("Choose an academic or course in the extra panel before submitting both reviews.", true);
    return;
  }
  const linkedComment = elements.linkedReviewComment.value.trim();
  const loggedIn = isLoggedIn();
  const author = loggedIn ? currentAuthorLabel() : (elements.reviewAuthor.value.trim() || "Anonymous");
  const semester = item.type === "course" ? elements.reviewSemester.value : "";
  if (item.type === "course" && !semester) {
    updateFeedback("Choose the semester when you took this course.", true);
    return;
  }
  const takenYear = item.type === "course" ? elements.reviewYear.value : "";
  if (item.type === "course" && !takenYear) {
    updateFeedback("Choose the year when you took this course.", true);
    return;
  }
  const selectedAcademic = item.type === "course" ? getItemById(elements.reviewAcademic.value) : null;
  const selectedAcademicName = item.type === "course"
    ? (elements.reviewAcademic.value === "__other__"
        ? elements.reviewAcademicOther.value.trim()
        : (selectedAcademic?.name || ""))
    : "";
  if (item.type === "course" && elements.reviewAcademic.value === "__other__" && !selectedAcademicName) {
    updateFeedback("Choose Other and then write the academic name.", true);
    return;
  }
  const linkedSemester = linkedTarget?.type === "course" ? elements.linkedReviewSemester.value : "";
  if (saveLinkedReview && linkedTarget?.type === "course" && !linkedSemester) {
    updateFeedback("Choose the semester for the additional course review.", true);
    return;
  }
  const linkedTakenYear = linkedTarget?.type === "course" ? elements.linkedReviewYear.value : "";
  if (saveLinkedReview && linkedTarget?.type === "course" && !linkedTakenYear) {
    updateFeedback("Choose the year for the additional course review.", true);
    return;
  }
  const linkedSelectedAcademic = linkedTarget?.type === "course" ? getItemById(elements.linkedReviewAcademic.value) : null;
  const linkedSelectedAcademicName = linkedTarget?.type === "course"
    ? (elements.linkedReviewAcademic.value === "__other__"
        ? elements.linkedReviewAcademicOther.value.trim()
        : (linkedSelectedAcademic?.name || ""))
    : "";
  if (saveLinkedReview && linkedTarget?.type === "course" && elements.linkedReviewAcademic.value === "__other__" && !linkedSelectedAcademicName) {
    updateFeedback("Choose Other and then write the academic name for the additional course review.", true);
    return;
  }

  try {
    const wasEditing = Boolean(state.editingReviewId);
    const savedReviews = [];
    const mainMetricA = Number(elements.reviewMetricA.value);
    const mainMetricB = Number(elements.reviewMetricB.value);
    const mainMetricC = Number(elements.reviewMetricC.value);
    const mainPayload = {
      itemId: item.id,
      itemType: item.type,
      author,
      overall: Number(overallFromMetrics(mainMetricA, mainMetricB, mainMetricC).toFixed(1)),
      metricA: mainMetricA,
      metricB: mainMetricB,
      metricC: mainMetricC,
      semester,
      takenYear,
      academicId: selectedAcademic?.id || "",
      academicName: selectedAcademicName,
      tags: [],
      comment
    };
    const mainReview = wasEditing
      ? await updateReviewPayload(state.editingReviewId, mainPayload)
      : await submitReviewPayload(mainPayload);
    savedReviews.push(mainReview);

    if (saveLinkedReview && !wasEditing) {
      const linkedMetricA = Number(elements.linkedReviewMetricA.value);
      const linkedMetricB = Number(elements.linkedReviewMetricB.value);
      const linkedMetricC = Number(elements.linkedReviewMetricC.value);
      const linkedReview = await submitReviewPayload({
        itemId: linkedTarget.id,
        itemType: linkedTarget.type,
        author,
        overall: Number(overallFromMetrics(linkedMetricA, linkedMetricB, linkedMetricC).toFixed(1)),
        metricA: linkedMetricA,
        metricB: linkedMetricB,
        metricC: linkedMetricC,
        semester: linkedSemester,
        takenYear: linkedTakenYear,
        academicId: linkedSelectedAcademic?.id || "",
        academicName: linkedSelectedAcademicName,
        tags: [],
        comment: linkedComment
      });
      savedReviews.push(linkedReview);
    }

    savedReviews.forEach((review) => {
      const existingIndex = state.sharedReviews.findIndex((entry) => entry.id === review.id);
      if (existingIndex >= 0) {
        state.sharedReviews.splice(existingIndex, 1, review);
      } else {
        state.sharedReviews.unshift(review);
      }
    });
    updateCounts();
    renderResults();
    renderDetail();
    exitEditMode();
    updateFeedback(
      wasEditing
        ? "Success: your changes were saved."
        : saveLinkedReview
        ? `Success: both reviews were published${author === "Anonymous" ? " as Anonymous" : ""}.`
        : `Success: your review was published${author === "Anonymous" ? " as Anonymous" : ""}.`
    );
    updateSyncStatus(`Shared review sync live. ${state.sharedReviews.length} server review${state.sharedReviews.length === 1 ? "" : "s"} loaded.`);
    trackReviewSubmit(item, saveLinkedReview);
  } catch (error) {
    const errorMessage = error.message || "Unable to save review right now.";
    updateFeedback(`Review could not be published: ${errorMessage}`, true);
  }
}

async function hydrateAuthState(session) {
  authState.session = session;
  authState.user = session?.user || null;
  authState.profile = null;
  if (authState.session) {
    try {
      await fetchAuthProfile();
    } catch (error) {
      updateFeedback(error.message || "Unable to load your saved profile.", true);
    }
  }
  syncReviewIdentity();
  renderDetail();
}

async function initAuth(config) {
  if (!config.supabaseUrl || !config.supabasePublishableKey || !window.supabase?.createClient) {
    syncReviewIdentity();
    return;
  }
  authState.client = window.supabase.createClient(config.supabaseUrl, config.supabasePublishableKey);
  const {
    data: { session }
  } = await authState.client.auth.getSession();
  await hydrateAuthState(session);
  authState.client.auth.onAuthStateChange(async (_event, sessionValue) => {
    await hydrateAuthState(sessionValue);
  });
}

async function handleAuthSubmit(event) {
  event.preventDefault();
  if (!authState.client) {
    updateAuthFeedback("Login is not configured on this deployment yet.", true);
    return;
  }
  clearAuthFeedback();
  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;
  try {
    if (state.authMode === "signup") {
      const displayName = elements.authDisplayName.value.trim();
      const username = elements.authUsername.value.trim().toLowerCase();
      const phone = elements.authPhone.value.trim();
      if (!displayName || !username) {
        throw new Error("Name and username are required to create an account.");
      }
      if (isLoggedIn()) {
        await saveAuthProfile({ displayName, username, phone });
        updateAuthFeedback("Profile updated.");
        closeAuthModal();
        syncReviewIdentity();
        renderDetail();
        updateFeedback("Profile updated. Your future signed-in reviews will use these details.");
        return;
      }
      const { error } = await authState.client.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            username,
            phone
          }
        }
      });
      if (error) {
        throw error;
      }
      const currentSession = (await authState.client.auth.getSession()).data.session;
      if (currentSession) {
        await hydrateAuthState(currentSession);
        await saveAuthProfile({ displayName, username, phone });
      }
      updateAuthFeedback("Account created. Check your email if Supabase asks you to confirm it.");
      closeAuthModal();
      updateFeedback("Account created. You can now post signed-in reviews and edit them later.");
      renderDetail();
      return;
    }

    const { error } = await authState.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      throw error;
    }
    updateAuthFeedback("Signed in successfully.");
    closeAuthModal();
    updateFeedback("Signed in successfully. Your next review will be attached to your account.");
  } catch (error) {
    updateAuthFeedback(error.message || "Unable to complete sign in right now.", true);
  }
}

async function handleGoogleSignIn() {
  if (!authState.client) {
    updateAuthFeedback("Login is not configured on this deployment yet.", true);
    return;
  }
  clearAuthFeedback();
  const redirectTo = `${window.location.origin}${window.location.pathname}${window.location.hash || "#directory"}`;
  const { error } = await authState.client.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo
    }
  });
  if (error) {
    updateAuthFeedback(error.message || "Unable to start Google sign-in.", true);
  }
}

async function handleSignOut() {
  if (!authState.client) {
    return;
  }
  await authState.client.auth.signOut();
  exitEditMode();
  updateFeedback("Signed out. Guest posting is still available.");
}

function bindFilters() {
  elements.authLaunch.addEventListener("click", () => {
    if (isLoggedIn()) {
      openAuthModal("signup");
    } else {
      openAuthModal("signin");
    }
  });
  elements.reviewAuthAction.addEventListener("click", () => {
    if (isLoggedIn()) {
      openAuthModal("signup");
    } else {
      openAuthModal("signin");
    }
  });
  elements.reviewSignout.addEventListener("click", handleSignOut);
  elements.authClose.addEventListener("click", closeAuthModal);
  elements.authModalBackdrop.addEventListener("click", closeAuthModal);
  elements.authModeSignIn.addEventListener("click", () => {
    state.authMode = "signin";
    syncAuthMode();
    clearAuthFeedback();
  });
  elements.authModeSignUp.addEventListener("click", () => {
    state.authMode = "signup";
    syncAuthMode();
    clearAuthFeedback();
  });
  elements.authGoogle.addEventListener("click", handleGoogleSignIn);
  elements.authForm.addEventListener("submit", handleAuthSubmit);
  elements.reviewCancelEdit.addEventListener("click", () => {
    exitEditMode();
    updateFeedback("Edit cancelled.");
  });
  elements.searchForm.addEventListener("submit", (event) => {
    event.preventDefault();
    runDirectorySearch();
  });
  elements.searchInput.addEventListener("input", () => {
    state.search = elements.searchInput.value.trim();
    returnToBrowseForDirectoryChange();
    syncSelectionToVisibleResults();
    renderResults();
    renderDetail();
  });

  [elements.coursesTab, elements.professorsTab].forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      syncTypeTabs();
      populateSchoolFilter();
      if (moveDetailViewToVisibleResult()) {
        return;
      }
      syncSelectionToVisibleResults();
      renderResults();
      renderDetail();
    });
  });

  [elements.allCollegesTab, elements.cbeTab, elements.lawTab, elements.cassTab, elements.capTab, elements.csmTab, elements.cssTab].forEach((button) => {
    button.addEventListener("click", () => {
      state.college = button.dataset.college;
      syncCollegeTabs();
      populateSchoolFilter();
      if (moveDetailViewToVisibleResult()) {
        updateCounts();
        return;
      }
      syncSelectionToVisibleResults();
      updateCounts();
      renderResults();
      renderDetail();
    });
  });

  elements.schoolFilter.addEventListener("change", () => {
    state.school = elements.schoolFilter.value;
    if (moveDetailViewToVisibleResult()) {
      return;
    }
    syncSelectionToVisibleResults();
    renderResults();
    renderDetail();
  });
  elements.levelFilter.addEventListener("change", () => {
    state.level = elements.levelFilter.value;
    populateSchoolFilter();
    if (moveDetailViewToVisibleResult()) {
      return;
    }
    syncSelectionToVisibleResults();
    renderResults();
    renderDetail();
  });
  elements.sortFilter.addEventListener("change", () => {
    state.sort = elements.sortFilter.value;
    if (moveDetailViewToVisibleResult()) {
      return;
    }
    syncSelectionToVisibleResults();
    renderResults();
    renderDetail();
  });
  elements.backToResults.addEventListener("click", () => {
    openBrowse();
  });
  elements.backToSearch.addEventListener("click", () => {
    openBrowse();
    document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
    elements.searchInput.focus();
  });
  elements.prevItem.addEventListener("click", () => {
    const items = filteredOnlyCurrentType();
    const index = items.findIndex((item) => item.id === state.selectedId);
    if (index > 0) {
      openDetail(items[index - 1].id);
    }
  });
  elements.nextItem.addEventListener("click", () => {
    const items = filteredOnlyCurrentType();
    const index = items.findIndex((item) => item.id === state.selectedId);
    if (index > -1 && index < items.length - 1) {
      openDetail(items[index + 1].id);
    }
  });
  elements.linkedReviewEnabled.addEventListener("change", () => {
    syncLinkedReviewPanel();
    if (elements.linkedReviewEnabled.checked && !elements.linkedReviewPanel.classList.contains("is-hidden")) {
      elements.linkedReviewSearch.focus();
    }
  });
  elements.linkedReviewSearch.addEventListener("input", () => {
    if (!elements.linkedReviewEnabled.checked) {
      return;
    }
    syncLinkedReviewPanel();
  });
  elements.linkedReviewTarget.addEventListener("change", () => {
    syncLinkedReviewPanel();
  });
  elements.reviewAcademicSearch.addEventListener("input", () => {
    const currentItem = getItemById(state.selectedId);
    populateAcademicSelect(elements.reviewAcademic, elements.reviewAcademicSearch, currentItem);
    syncOtherAcademicInput(elements.reviewAcademic, elements.reviewAcademicOther);
  });
  elements.linkedReviewAcademicSearch.addEventListener("input", () => {
    const linkedTarget = getItemById(elements.linkedReviewTarget.value);
    populateAcademicSelect(elements.linkedReviewAcademic, elements.linkedReviewAcademicSearch, linkedTarget);
    syncOtherAcademicInput(elements.linkedReviewAcademic, elements.linkedReviewAcademicOther);
  });
  elements.reviewAcademic.addEventListener("change", () => {
    const currentItem = getItemById(state.selectedId);
    populateAcademicSelect(elements.reviewAcademic, elements.reviewAcademicSearch, currentItem, elements.reviewAcademic.value);
    syncOtherAcademicInput(elements.reviewAcademic, elements.reviewAcademicOther);
  });
  elements.linkedReviewAcademic.addEventListener("change", () => {
    const linkedTarget = getItemById(elements.linkedReviewTarget.value);
    populateAcademicSelect(elements.linkedReviewAcademic, elements.linkedReviewAcademicSearch, linkedTarget, elements.linkedReviewAcademic.value);
    syncOtherAcademicInput(elements.linkedReviewAcademic, elements.linkedReviewAcademicOther);
  });
  [
    [elements.reviewMetricA, elements.reviewMetricB, elements.reviewMetricC, elements.reviewOverall],
    [elements.linkedReviewMetricA, elements.linkedReviewMetricB, elements.linkedReviewMetricC, elements.linkedReviewOverall]
  ].forEach(([metricA, metricB, metricC, output]) => {
    [metricA, metricB, metricC].forEach((select) => {
      select.addEventListener("change", () => {
        updateComputedOverall(output, metricA, metricB, metricC);
      });
    });
  });
  [
    [elements.reviewSortFilter, "reviewSort"],
    [elements.reviewSemesterFilter, "reviewSemester"],
    [elements.reviewYearFilter, "reviewYear"]
  ].forEach(([select, stateKey]) => {
    select.addEventListener("change", () => {
      state[stateKey] = select.value;
      const currentItem = getItemById(state.selectedId);
      if (currentItem) {
        renderReviews(currentItem);
      }
    });
  });
  elements.reviewForm.addEventListener("submit", handleReviewSubmit);
}

function initSelects() {
  [
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  ].forEach(buildRatingOptions);
  updateComputedOverall(
    elements.reviewOverall,
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC
  );
  updateComputedOverall(
    elements.linkedReviewOverall,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  );
}

async function init() {
  initSelects();
  syncCollegeTabs();
  state.type = "course";
  syncTypeTabs();
  renderSources();
  bindFilters();
  announceBundledCatalog();

  try {
    const config = await fetchPublicConfig();
    if (config.gaMeasurementId) {
      ensureAnalyticsLoaded(config.gaMeasurementId);
    }
    await initAuth(config);
  } catch (error) {
    console.warn(error.message);
  }

  populateSchoolFilter();
  state.selectedId = filteredItems()[0]?.id || dataset.courses[0]?.id || null;
  const hash = window.location.hash || "";
  const match = hash.match(/#item=([^&]+)/);
  if (match) {
    const candidate = decodeURIComponent(match[1]);
    if (getItemById(candidate)) {
      state.selectedId = candidate;
      state.view = "detail";
    }
  }

  try {
    await fetchSharedReviews();
  } catch (error) {
    updateSyncStatus("Shared review server unavailable. Seed reviews still visible.");
    updateFeedback(error.message || "Unable to connect to shared review storage.", true);
  }

  updateCounts();
  renderResults();
  renderDetail();
  renderPageState();
  trackCurrentPageView(true);
}

init();
