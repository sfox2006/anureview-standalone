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
  sharedReviews: [],
  reportCount: 0,
  syncState: "Connecting to local ANReview server..."
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
  detailLinkedTitle: document.getElementById("detail-linked-title"),
  detailLinks: document.getElementById("detail-links"),
  reviewSummary: document.getElementById("review-summary"),
  reviewList: document.getElementById("review-list"),
  reviewForm: document.getElementById("review-form"),
  reviewAuthor: document.getElementById("review-author"),
  reviewPanelSubtitle: document.getElementById("review-panel-subtitle"),
  reviewOverall: document.getElementById("review-overall"),
  reviewMetricALabel: document.getElementById("review-metric-a-label"),
  reviewMetricA: document.getElementById("review-metric-a"),
  reviewMetricBLabel: document.getElementById("review-metric-b-label"),
  reviewMetricB: document.getElementById("review-metric-b"),
  reviewMetricCLabel: document.getElementById("review-metric-c-label"),
  reviewMetricC: document.getElementById("review-metric-c"),
  reviewTags: document.getElementById("review-tags"),
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
  linkedReviewMetricALabel: document.getElementById("linked-review-metric-a-label"),
  linkedReviewMetricA: document.getElementById("linked-review-metric-a"),
  linkedReviewMetricBLabel: document.getElementById("linked-review-metric-b-label"),
  linkedReviewMetricB: document.getElementById("linked-review-metric-b"),
  linkedReviewMetricCLabel: document.getElementById("linked-review-metric-c-label"),
  linkedReviewMetricC: document.getElementById("linked-review-metric-c"),
  linkedReviewTags: document.getElementById("linked-review-tags"),
  linkedReviewComment: document.getElementById("linked-review-comment"),
  reviewFeedback: document.getElementById("review-feedback"),
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
  document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function buildRatingOptions(select) {
  select.innerHTML = "";
  for (let rating = 5; rating >= 1; rating -= 1) {
    const option = document.createElement("option");
    option.value = String(rating);
    option.textContent = `${rating} / 5`;
    select.appendChild(option);
  }
  select.value = "4";
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
}

function openBrowse() {
  state.view = "browse";
  syncRoute();
  renderPageState();
}

function getReviewsForItem(itemId) {
  return [...dataset.seedReviews, ...state.sharedReviews].filter((review) => review.itemId === itemId);
}

function average(values) {
  if (!values.length) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function ratingSummary(itemId) {
  const reviews = getReviewsForItem(itemId);
  return {
    count: reviews.length,
    overall: average(reviews.map((review) => review.overall)),
    metricA: average(reviews.map((review) => review.metricA)),
    metricB: average(reviews.map((review) => review.metricB)),
    metricC: average(reviews.map((review) => review.metricC))
  };
}

function formatScore(value) {
  return value ? value.toFixed(1) : "0.0";
}

function metricLabelsFor(item) {
  return item.type === "course"
    ? item.reviewMetrics || ["Teaching quality", "Workload fairness", "Assessment design"]
    : item.reviewMetrics || ["Clarity", "Support", "Engagement"];
}

function updateSyncStatus(message) {
  state.syncState = message;
  elements.syncStatus.textContent = message;
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
      reviewMetrics: existing.reviewMetrics || course.reviewMetrics || ["Teaching quality", "Workload fairness", "Assessment design"]
    };
  });
  const seen = new Set(merged.map((course) => course.id));
  dataset.courses = [
    ...merged,
    ...dataset.courses.filter((course) => !seen.has(course.id))
  ];
}

function announceBundledCatalog() {
  const courseCount = dataset.courses.length;
  const academics = dataset.academics;
  const cbeCount = academics.filter((item) => getCollegeForItem(item) === "cbe").length;
  const lawCount = academics.filter((item) => getCollegeForItem(item) === "law").length;
  const cassCount = academics.filter((item) => getCollegeForItem(item) === "cass").length;
  const capCount = academics.filter((item) => getCollegeForItem(item) === "cap").length;
  const csmCount = academics.filter((item) => getCollegeForItem(item) === "csm").length;
  const cssCount = academics.filter((item) => getCollegeForItem(item) === "css").length;
  updateSyncStatus(
    `Using fixed ANReview catalogue snapshot. ${courseCount} courses, ${cbeCount} CBE academics, ${lawCount} CLGP academics, ${cassCount} CASS academics, ${capCount} CAP academics, ${csmCount} CSM academics, and ${cssCount} CSS academics loaded instantly.`
  );
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
      createChip(item.type === "course" ? "Course" : "Professor", "score-badge"),
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
}

function resetLinkedReviewPanel() {
  elements.linkedReviewEnabled.checked = false;
  elements.linkedReviewToggleWrap.classList.remove("is-hidden");
  elements.linkedReviewPanel.classList.add("is-hidden");
  elements.linkedReviewHint.textContent = "";
  elements.linkedReviewSearch.value = "";
  elements.linkedReviewTarget.innerHTML = "";
  elements.linkedReviewTags.value = "";
  elements.linkedReviewComment.value = "";
}

function filteredCompanionItems(item) {
  const search = elements.linkedReviewSearch.value.trim().toLowerCase();
  const source = companionItemsFor(item);
  if (!search) {
    return source.slice(0, 150);
  }

  const matches = source.filter((candidate) => {
    const haystack = candidate.type === "course"
      ? `${candidate.code} ${candidate.name} ${candidate.school}`.toLowerCase()
      : `${candidate.name} ${candidate.position} ${candidate.school}`.toLowerCase();
    return haystack.includes(search);
  });
  return matches.slice(0, 150);
}

function populateLinkedReviewTargets(item) {
  const currentValue = elements.linkedReviewTarget.value;
  const candidates = filteredCompanionItems(item);
  elements.linkedReviewTarget.innerHTML = "";

  candidates.forEach((candidate) => {
    const option = document.createElement("option");
    option.value = candidate.id;
    option.textContent = itemDisplayName(candidate);
    elements.linkedReviewTarget.appendChild(option);
  });

  if (!candidates.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "No matches found";
    elements.linkedReviewTarget.appendChild(option);
    elements.linkedReviewTarget.value = "";
    return [];
  }

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
    elements.linkedReviewTitle.textContent = item.type === "course" ? "Additional professor review" : "Additional course review";
    elements.linkedReviewSubtitle.textContent = "No matching result yet. Keep typing to find the right item.";
    return;
  }

  elements.linkedReviewTitle.textContent = activeTarget.type === "course" ? "Additional course review" : "Additional professor review";
  elements.linkedReviewSubtitle.textContent = itemDisplayName(activeTarget);
  metricLabelsForReviewElements(activeTarget, {
    metricALabel: elements.linkedReviewMetricALabel,
    metricBLabel: elements.linkedReviewMetricBLabel,
    metricCLabel: elements.linkedReviewMetricCLabel
  });
}

function configureLinkedReviewPanel(item) {
  resetLinkedReviewPanel();
  if (!item) {
    elements.linkedReviewToggleWrap.classList.add("is-hidden");
    return;
  }

  elements.linkedReviewToggleCopy.textContent =
    item.type === "course"
      ? "Also rate a professor at the same time"
      : "Also rate a course at the same time";
  elements.linkedReviewToggleSubcopy.textContent =
    item.type === "course"
      ? "Tick this to open a searchable professor review beside the course review."
      : "Tick this to open a searchable course review beside the professor review.";
  elements.linkedReviewSearchLabel.textContent = item.type === "course" ? "Search professor" : "Search course";
  elements.linkedReviewSearch.placeholder =
    item.type === "course"
      ? "Start typing a professor name"
      : "Start typing a course code or title";
  elements.linkedReviewTargetLabel.textContent = item.type === "course" ? "Professor" : "Course";

  elements.linkedReviewHint.textContent =
    item.type === "course"
      ? "Tick this to open a search panel and rate any professor in the ANRevU sample alongside the course."
      : "Tick this to open a search panel and rate any course in the ANRevU sample alongside the professor.";
  populateLinkedReviewTargets(item);
}

function renderLinkedEntities(item) {
  elements.detailLinks.innerHTML = "";
  if (item.type === "course") {
    elements.detailLinkedTitle.textContent = "Linked staff";
    item.conveners.map(getItemById).filter(Boolean).forEach((academic) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = academic.name;
      button.addEventListener("click", () => {
        openDetail(academic.id);
      });
      elements.detailLinks.appendChild(button);
    });
    return;
  }

  elements.detailLinkedTitle.textContent = "Linked courses";
  linkedItemsFor(item).forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${course.code} ${course.name}`;
    button.addEventListener("click", () => {
      openDetail(course.id);
    });
    elements.detailLinks.appendChild(button);
  });
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
    updateFeedback("Review reported for moderator review.");
    triggerButton.textContent = "Reported";
  } catch (error) {
    updateFeedback(error.message || "Unable to report review right now.", true);
    triggerButton.disabled = false;
  }
}

function renderReviews(item) {
  const reviews = getReviewsForItem(item.id).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  elements.reviewList.innerHTML = "";
  elements.reviewSummary.textContent = `${reviews.length} review${reviews.length === 1 ? "" : "s"} on this item`;

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
      createChip(`${formatScore(review.overall)} overall`, "score-badge"),
      createChip(review.createdAt),
      createChip(review.id.startsWith("shared-") ? "Shared server review" : "Seed review", "tag-chip")
    );

    const metricRow = document.createElement("div");
    metricRow.className = "result-tags";
    const [metricA, metricB, metricC] = metricLabelsFor(item);
    [metricA, metricB, metricC].forEach((label, index) => {
      const values = [review.metricA, review.metricB, review.metricC];
      metricRow.append(createChip(`${label}: ${values[index]}/5`, "tag-chip"));
    });

    const quote = document.createElement("blockquote");
    quote.textContent = review.comment;

    const footer = document.createElement("div");
    footer.className = "review-actions";
    const tags = document.createElement("div");
    tags.className = "result-tags";
    (review.tags || []).forEach((tag) => tags.append(createChip(tag, "tag-chip")));

    const reportButton = document.createElement("button");
    reportButton.type = "button";
    reportButton.className = "report-button";
    reportButton.textContent = "Report";
    reportButton.addEventListener("click", () => {
      reportReview(review, reportButton);
    });

    footer.append(tags, reportButton);
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
  elements.detailType.textContent = item.type === "course" ? "Course" : "Professor";
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
  renderLinkedEntities(item);
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

function updateFeedback(message, isError = false) {
  elements.reviewFeedback.textContent = message;
  elements.reviewFeedback.style.color = isError ? "#a33c22" : "#19483d";
}

function parseTags(value) {
  return value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);
}

async function submitReviewPayload(payload) {
  const response = await fetch("/api/anreview/reviews", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  const result = await response.json();
  if (!response.ok || !result.ok) {
    throw new Error(result.error || "Unable to save review.");
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
  if (comment.length < 20) {
    updateFeedback("Write at least 20 characters so the review is useful.", true);
    return;
  }

  const linkedTarget = getItemById(elements.linkedReviewTarget.value);
  const saveLinkedReview = Boolean(
    elements.linkedReviewEnabled.checked &&
    !elements.linkedReviewPanel.classList.contains("is-hidden")
  );
  if (saveLinkedReview && !linkedTarget) {
    updateFeedback("Choose a professor or course in the extra panel before submitting both reviews.", true);
    return;
  }
  const linkedComment = elements.linkedReviewComment.value.trim();
  if (saveLinkedReview && linkedComment.length < 20) {
    updateFeedback("Write at least 20 characters for the linked review as well.", true);
    return;
  }

  const author = elements.reviewAuthor.value.trim() || "Anonymous";
  const tags = parseTags(elements.reviewTags.value);

  try {
    const savedReviews = [];
    const mainReview = await submitReviewPayload({
      itemId: item.id,
      itemType: item.type,
      author,
      overall: Number(elements.reviewOverall.value),
      metricA: Number(elements.reviewMetricA.value),
      metricB: Number(elements.reviewMetricB.value),
      metricC: Number(elements.reviewMetricC.value),
      tags,
      comment
    });
    savedReviews.push(mainReview);

    if (saveLinkedReview) {
      const linkedReview = await submitReviewPayload({
        itemId: linkedTarget.id,
        itemType: linkedTarget.type,
        author,
        overall: Number(elements.linkedReviewOverall.value),
        metricA: Number(elements.linkedReviewMetricA.value),
        metricB: Number(elements.linkedReviewMetricB.value),
        metricC: Number(elements.linkedReviewMetricC.value),
        tags: parseTags(elements.linkedReviewTags.value),
        comment: linkedComment
      });
      savedReviews.push(linkedReview);
    }

    savedReviews.slice().reverse().forEach((review) => state.sharedReviews.unshift(review));
    updateCounts();
    renderResults();
    renderDetail();
    elements.reviewForm.reset();
    [
      elements.reviewOverall,
      elements.reviewMetricA,
      elements.reviewMetricB,
      elements.reviewMetricC,
      elements.linkedReviewOverall,
      elements.linkedReviewMetricA,
      elements.linkedReviewMetricB,
      elements.linkedReviewMetricC
    ].forEach(buildRatingOptions);
    resetLinkedReviewPanel();
    configureLinkedReviewPanel(item);
    updateFeedback(
      saveLinkedReview
        ? `Both reviews were saved to the shared ANReview server${author === "Anonymous" ? " as Anonymous" : ""}.`
        : `Your review was saved to the shared ANReview server${author === "Anonymous" ? " as Anonymous" : ""}.`
    );
    updateSyncStatus(`Shared review sync live. ${state.sharedReviews.length} server review${state.sharedReviews.length === 1 ? "" : "s"} loaded.`);
  } catch (error) {
    updateFeedback(error.message || "Unable to save review right now.", true);
  }
}

function bindFilters() {
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
  elements.reviewForm.addEventListener("submit", handleReviewSubmit);
}

function initSelects() {
  [
    elements.reviewOverall,
    elements.reviewMetricA,
    elements.reviewMetricB,
    elements.reviewMetricC,
    elements.linkedReviewOverall,
    elements.linkedReviewMetricA,
    elements.linkedReviewMetricB,
    elements.linkedReviewMetricC
  ].forEach(buildRatingOptions);
}

async function init() {
  initSelects();
  syncCollegeTabs();
  state.type = "course";
  syncTypeTabs();
  renderSources();
  bindFilters();
  announceBundledCatalog();

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
}

init();
