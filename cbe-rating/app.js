const dataset = window.ANREVIEW_DATA;

const state = {
  selectedId: null,
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
  coursesTab: document.getElementById("courses-tab"),
  professorsTab: document.getElementById("professors-tab"),
  searchInput: document.getElementById("search-input"),
  schoolFilter: document.getElementById("school-filter"),
  levelFilter: document.getElementById("level-filter"),
  sortFilter: document.getElementById("sort-filter"),
  resultsMeta: document.getElementById("results-meta"),
  resultsGrid: document.getElementById("results-grid"),
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
  reviewOverall: document.getElementById("review-overall"),
  reviewMetricALabel: document.getElementById("review-metric-a-label"),
  reviewMetricA: document.getElementById("review-metric-a"),
  reviewMetricBLabel: document.getElementById("review-metric-b-label"),
  reviewMetricB: document.getElementById("review-metric-b"),
  reviewMetricCLabel: document.getElementById("review-metric-c-label"),
  reviewMetricC: document.getElementById("review-metric-c"),
  reviewTags: document.getElementById("review-tags"),
  reviewComment: document.getElementById("review-comment"),
  reviewFeedback: document.getElementById("review-feedback"),
  sourceList: document.getElementById("source-list")
};

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

function allItems() {
  return [...dataset.courses, ...dataset.academics];
}

function getCollegeForItem(item) {
  const schoolText = `${item.school || ""} ${item.schoolCode || ""}`.toLowerCase();
  return schoolText.includes("law") ? "law" : "cbe";
}

function getItemById(itemId) {
  return allItems().find((item) => item.id === itemId);
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

async function fetchOfficialCatalog() {
  const response = await fetch("/api/anreview/catalog");
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload.error || "Unable to load official ANU faculty data.");
  }
  mergeOfficialCourses(payload.courses || []);
  mergeOfficialAcademics(payload.academics || []);
}

async function fetchSharedReviews() {
  updateSyncStatus("Syncing with local ANReview server...");
  const response = await fetch("/api/anreview/reviews");
  if (!response.ok) {
    throw new Error("Unable to reach ANReview review storage.");
  }
  const payload = await response.json();
  state.sharedReviews = payload.reviews || [];
  state.reportCount = payload.reportCount || 0;
  elements.moderationCount.textContent = String(state.reportCount);
  updateSyncStatus(`Shared review sync live. ${state.sharedReviews.length} server review${state.sharedReviews.length === 1 ? "" : "s"} loaded.`);
}

function populateSchoolFilter() {
  const schools = [...new Set(allItems().filter((item) => state.college === "all" || getCollegeForItem(item) === state.college).map((item) => item.school))].sort((a, b) => a.localeCompare(b));
  elements.schoolFilter.innerHTML = "";
  const base = document.createElement("option");
  base.value = "all";
  base.textContent = "All schools";
  elements.schoolFilter.appendChild(base);
  schools.forEach((school) => {
    const option = document.createElement("option");
    option.value = school;
    option.textContent = school;
    elements.schoolFilter.appendChild(option);
  });
  if (![...elements.schoolFilter.options].some((option) => option.value === state.school)) {
    state.school = "all";
  }
  elements.schoolFilter.value = state.school;
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
      if (state.school !== "all" && item.school !== state.school) {
        return false;
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
      state.selectedId = item.id;
      renderResults();
      renderDetail();
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
  elements.reviewMetricALabel.textContent = metricA;
  elements.reviewMetricBLabel.textContent = metricB;
  elements.reviewMetricCLabel.textContent = metricC;
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
        state.selectedId = academic.id;
        renderResults();
        renderDetail();
      });
      elements.detailLinks.appendChild(button);
    });
    return;
  }

  elements.detailLinkedTitle.textContent = "Linked courses";
  (item.linkedCourses || []).map(getItemById).filter(Boolean).forEach((course) => {
    const button = document.createElement("button");
    button.type = "button";
    button.textContent = `${course.code} ${course.name}`;
    button.addEventListener("click", () => {
      state.selectedId = course.id;
      renderResults();
      renderDetail();
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

  const tags = elements.reviewTags.value
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean)
    .slice(0, 5);

  try {
    const response = await fetch("/api/anreview/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: item.id,
        itemType: item.type,
        author: elements.reviewAuthor.value.trim() || "Anonymous",
        overall: Number(elements.reviewOverall.value),
        metricA: Number(elements.reviewMetricA.value),
        metricB: Number(elements.reviewMetricB.value),
        metricC: Number(elements.reviewMetricC.value),
        tags,
        comment
      })
    });

    const payload = await response.json();
    if (!response.ok || !payload.ok) {
      throw new Error(payload.error || "Unable to save review.");
    }

    state.sharedReviews.unshift(payload.review);
    updateCounts();
    renderResults();
    renderDetail();
    elements.reviewForm.reset();
    [elements.reviewOverall, elements.reviewMetricA, elements.reviewMetricB, elements.reviewMetricC].forEach(buildRatingOptions);
    updateFeedback("Your review was saved to the shared ANReview server.");
    updateSyncStatus(`Shared review sync live. ${state.sharedReviews.length} server review${state.sharedReviews.length === 1 ? "" : "s"} loaded.`);
  } catch (error) {
    updateFeedback(error.message || "Unable to save review right now.", true);
  }
}

function bindFilters() {
  elements.searchInput.addEventListener("input", () => {
    state.search = elements.searchInput.value;
    renderResults();
  });

  [elements.coursesTab, elements.professorsTab].forEach((button) => {
    button.addEventListener("click", () => {
      state.type = button.dataset.type;
      syncTypeTabs();
      if (state.selectedId && getItemById(state.selectedId)?.type !== state.type) {
        state.selectedId = filteredItems()[0]?.id || null;
      }
      renderResults();
      renderDetail();
    });
  });

  [elements.allCollegesTab, elements.cbeTab, elements.lawTab].forEach((button) => {
    button.addEventListener("click", () => {
      state.college = button.dataset.college;
      syncCollegeTabs();
      populateSchoolFilter();
      if (state.selectedId && !filteredItems().some((item) => item.id === state.selectedId)) {
        state.selectedId = filteredItems()[0]?.id || null;
      }
      updateCounts();
      renderResults();
      renderDetail();
    });
  });

  elements.schoolFilter.addEventListener("change", () => {
    state.school = elements.schoolFilter.value;
    if (state.selectedId && !filteredItems().some((item) => item.id === state.selectedId)) {
      state.selectedId = filteredItems()[0]?.id || null;
    }
    renderResults();
    renderDetail();
  });
  elements.levelFilter.addEventListener("change", () => {
    state.level = elements.levelFilter.value;
    if (state.selectedId && !filteredItems().some((item) => item.id === state.selectedId)) {
      state.selectedId = filteredItems()[0]?.id || null;
    }
    renderResults();
    renderDetail();
  });
  elements.sortFilter.addEventListener("change", () => {
    state.sort = elements.sortFilter.value;
    renderResults();
  });
  elements.reviewForm.addEventListener("submit", handleReviewSubmit);
}

function initSelects() {
  [elements.reviewOverall, elements.reviewMetricA, elements.reviewMetricB, elements.reviewMetricC].forEach(buildRatingOptions);
}

async function init() {
  initSelects();
  syncCollegeTabs();
  state.type = "course";
  syncTypeTabs();
  renderSources();
  bindFilters();

  try {
    await fetchOfficialCatalog();
  } catch (error) {
    updateFeedback(error.message || "Unable to refresh official faculty data.", true);
  }

  populateSchoolFilter();
  state.selectedId = filteredItems()[0]?.id || dataset.courses[0]?.id || null;

  try {
    await fetchSharedReviews();
  } catch (error) {
    updateSyncStatus("Shared review server unavailable. Seed reviews still visible.");
    updateFeedback(error.message || "Unable to connect to shared review storage.", true);
  }

  updateCounts();
  renderResults();
  renderDetail();
}

init();
