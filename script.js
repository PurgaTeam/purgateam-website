const header = document.querySelector("body > header");
const pageSecondaryHeader = document.querySelector("body > .page-secondary-header");
const homeFeed = document.querySelector(".home-feed");
const newsletterArchive = document.querySelector(".newsletter-archive");
const newsletterViewport = document.querySelector("[data-newsletter-viewport]");
const newsletterGrid = document.querySelector("#newsletter-grid");
const newsletterPreviousButton = document.querySelector("[data-newsletter-previous]");
const newsletterNextButton = document.querySelector("[data-newsletter-next]");
const latestNewsletterPreview = document.querySelector("[data-latest-newsletter-preview]");
const reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
const primaryNav = document.querySelector(".primary-nav");
const primaryNavToggle = document.querySelector(".primary-nav__toggle");
const compactNavigationQuery = window.matchMedia("(max-width: 860px)");
const verticalLayoutQuery = window.matchMedia("(max-width: 860px), (orientation: portrait)");
const documentRoot = document.documentElement;
const isProjectPage = document.body.classList.contains("projects-page") || document.body.classList.contains("project-detail-page");
const isProjectDetailPage = document.body.classList.contains("project-detail-page");
const animationSwitch = document.querySelector("[data-animation-switch]");
const animationsOff = () => !isProjectDetailPage && documentRoot.classList.contains("animations-off");
const prefersLessMotion = () => reducedMotionQuery.matches || animationsOff();

if (animationSwitch) {
    animationSwitch.checked = !documentRoot.classList.contains("animations-off");
    animationSwitch.addEventListener("change", () => {
        documentRoot.classList.toggle("animations-off", !animationSwitch.checked);
        try {
            localStorage.setItem("purgateam-animations", animationSwitch.checked ? "on" : "off");
        } catch {
            // The switch still works for this page if storage is unavailable.
        }

        if (animationsOff()) {
            document.body.getAnimations({ subtree: true }).forEach((animation) => animation.cancel());
            documentRoot.classList.remove("page-transition-arriving", "page-transition-leaving");
            homeFeed?.classList.add("is-revealed");
            teamSection?.classList.add("is-revealed");
            teamSelectionClones.forEach((clone) => clone.remove());
            teamSelectionClones = [];
            teamSelectionAnimations = [];
            teamStageVisualLayer?.style.removeProperty("z-index");
            isTeamMemberAnimating = false;
            homeFeed?.style.removeProperty("--checker-parallax");
            newsletterArchive?.style.removeProperty("--newsletter-checker-parallax");
            teamStageTexture?.style.removeProperty("--team-checker-shift-x");
            teamStageTexture?.style.removeProperty("--team-checker-shift-y");
        }

        updateHeaderVisibility();
        updateProjectsParallax();
    });
}

if (isProjectPage) {
    if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
    }

    const resetProjectPageScroll = () => window.scrollTo(0, 0);

    resetProjectPageScroll();
    window.addEventListener("beforeunload", resetProjectPageScroll);
    window.addEventListener("pagehide", resetProjectPageScroll);
    window.addEventListener("pageshow", resetProjectPageScroll);
    window.requestAnimationFrame(resetProjectPageScroll);
}

function holdPrimaryHeaderHidden() {
    if (!header) {
        return;
    }

    documentRoot.classList.add("primary-header-forced-hidden");
    header.classList.add("nav-hidden");
    closePrimaryNavigation();
}

function releasePrimaryHeaderVisibilityLock() {
    documentRoot.classList.remove("primary-header-forced-hidden");
    header?.classList.remove("nav-hidden");
}

document.querySelectorAll(".secondary-header__socials a").forEach((socialLink) => {
    const baseIcon = socialLink.querySelector(".social-icon--base");

    if (!baseIcon || socialLink.querySelector(".social-icon--shadow")) {
        return;
    }

    const shadowIcon = baseIcon.cloneNode(false);
    shadowIcon.className = "social-icon--shadow";
    shadowIcon.alt = "";
    shadowIcon.setAttribute("aria-hidden", "true");
    socialLink.insertBefore(shadowIcon, baseIcon);
    socialLink.classList.add("has-layered-social-shadow");
});

if (documentRoot.classList.contains("animations-off")) {
    window.name = "";
    documentRoot.classList.remove("page-transition-arriving");
}

if (documentRoot.classList.contains("page-transition-arriving")) {
    if (window.name === "purgateam-page-transition") {
        window.name = "";
    }

    window.requestAnimationFrame(() => {
        window.requestAnimationFrame(() => {
            documentRoot.classList.remove("page-transition-arriving");
        });
    });
}

function closePrimaryNavigation() {
    if (!header || !primaryNavToggle) {
        return;
    }

    header.classList.remove("nav-menu-open");
    primaryNavToggle.setAttribute("aria-expanded", "false");
    primaryNavToggle.setAttribute("aria-label", "Open navigation");
}

if (header && primaryNav && primaryNavToggle) {
    primaryNavToggle.addEventListener("click", () => {
        const willOpen = !header.classList.contains("nav-menu-open");
        header.classList.toggle("nav-menu-open", willOpen);
        primaryNavToggle.setAttribute("aria-expanded", String(willOpen));
        primaryNavToggle.setAttribute("aria-label", willOpen ? "Close navigation" : "Open navigation");
    });

    primaryNav.addEventListener("click", (event) => {
        if (event.target.closest("a")) {
            closePrimaryNavigation();
        }
    });

    document.addEventListener("pointerdown", (event) => {
        if (header.classList.contains("nav-menu-open") && !primaryNav.contains(event.target) && !primaryNavToggle.contains(event.target)) {
            closePrimaryNavigation();
        }
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && header.classList.contains("nav-menu-open")) {
            closePrimaryNavigation();
            primaryNavToggle.focus();
        }
    });

    compactNavigationQuery.addEventListener("change", closePrimaryNavigation);
}

//page transitions

let pageTransitionRunning = false;

document.querySelectorAll("[data-site-transition]").forEach((link) => {
    link.addEventListener("click", (event) => {
        if (pageTransitionRunning || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
            return;
        }

        if (documentRoot.classList.contains("animations-off")) {
            window.name = "";
            return;
        }

        event.preventDefault();
        pageTransitionRunning = true;
        closePrimaryNavigation();
        header?.classList.remove("nav-hidden");
        documentRoot.classList.add("page-transition-leaving");

        const destination = link.href;
        const startingScroll = window.scrollY;
        const transitionDuration = prefersLessMotion() ? 0 : 900;
        const transitionStart = performance.now();

        const finishTransition = () => {
            window.scrollTo(0, 0);
            window.name = "purgateam-page-transition";
            window.setTimeout(() => {
                window.location.href = destination;
            }, prefersLessMotion() ? 0 : 120);
        };

        if (!transitionDuration) {
            finishTransition();
            return;
        }

        const scrollToTop = (timestamp) => {
            const progress = Math.min(1, (timestamp - transitionStart) / transitionDuration);
            const easedProgress = 1 - Math.pow(1 - progress, 4);
            window.scrollTo(0, startingScroll * (1 - easedProgress));

            if (progress < 1) {
                window.requestAnimationFrame(scrollToTop);
            } else {
                finishTransition();
            }
        };

        window.requestAnimationFrame(scrollToTop);
    });
});

let lastScrollPosition = window.scrollY;
let scrollFrameRequested = false;
let secondaryCollapseTimer;

const secondaryCollapsePoint = 40;
const secondaryRevealPoint = 4;
const secondaryTransitionDuration = 500;
const feedRevealPoint = 90;
const feedHidePoint = 24;
const homeTopExitPoint = 40;
const homeTopEnterPoint = 4;

let navigationCanHide = window.scrollY > secondaryCollapsePoint;

if (window.scrollY > secondaryCollapsePoint) {
    header.classList.add("secondary-collapsed");
}

if (homeFeed && window.scrollY > feedRevealPoint) {
    homeFeed.classList.add("is-revealed");
}

if (!animationsOff() && window.scrollY > homeTopExitPoint) {
    document.body.classList.remove("home-at-top");
}

function updateHomeFeedEffects(currentScrollPosition) {
    if (animationsOff() && homeFeed) {
        document.body.classList.remove("home-at-top", "mobile-ambition-expanded");
        homeFeed.classList.add("is-revealed");
        teamSection?.classList.add("is-revealed");
        homeFeed.style.removeProperty("--checker-parallax");
        return;
    }

    if (verticalLayoutQuery.matches && homeFeed) {
        const ambitionExpandPoint = 28;
        const ambitionCollapsePoint = 260;
        const mobileFeedRevealPoint = 280;
        const mobileFeedHidePoint = 230;
        const ambitionExpanded = currentScrollPosition >= ambitionExpandPoint && currentScrollPosition < ambitionCollapsePoint;

        document.body.classList.toggle("mobile-ambition-expanded", ambitionExpanded);
        document.body.classList.toggle("home-at-top", currentScrollPosition < ambitionCollapsePoint);
        updateTeamSectionReveal(currentScrollPosition);

        if (currentScrollPosition > mobileFeedRevealPoint) {
            homeFeed.classList.add("is-revealed");
        } else if (currentScrollPosition < mobileFeedHidePoint) {
            homeFeed.classList.remove("is-revealed");
        }

        if (prefersLessMotion()) {
            homeFeed.style.removeProperty("--checker-parallax");
            return;
        }

        const parallaxOffset = Math.max(0, currentScrollPosition * 0.5);
        homeFeed.style.setProperty("--checker-parallax", `${parallaxOffset}px`);
        return;
    }

    document.body.classList.remove("mobile-ambition-expanded");

    if (currentScrollPosition > homeTopExitPoint) {
        document.body.classList.remove("home-at-top");
    } else if (currentScrollPosition <= homeTopEnterPoint) {
        document.body.classList.add("home-at-top");
    }

    updateTeamSectionReveal(currentScrollPosition);

    if (!homeFeed) {
        return;
    }

    if (currentScrollPosition > feedRevealPoint) {
        homeFeed.classList.add("is-revealed");
    } else if (currentScrollPosition < feedHidePoint) {
        homeFeed.classList.remove("is-revealed");
    }

    if (prefersLessMotion()) {
        homeFeed.style.removeProperty("--checker-parallax");
        return;
    }

    const parallaxOffset = Math.max(0, currentScrollPosition * 0.5);
    homeFeed.style.setProperty("--checker-parallax", `${parallaxOffset}px`);
}

// newsletter page

function updateNewsletterArchiveEffects(currentScrollPosition) {
    if (!newsletterArchive) {
        return;
    }

    if (prefersLessMotion()) {
        newsletterArchive.style.removeProperty("--newsletter-checker-parallax");
        return;
    }

    const parallaxOffset = Math.max(0, currentScrollPosition * 0.5);
    newsletterArchive.style.setProperty("--newsletter-checker-parallax", `${parallaxOffset}px`);
}


function createPatreonNewsletterCard(post, index) {
    const motionPresets = [
        ["4.8s", "-1.2s", "6.4s", "-0.8s", "-0.85deg"],
        ["5.2s", "-2.6s", "7.1s", "-1.7s", "0.65deg"],
        ["5s", "-1.8s", "6.7s", "-2.1s", "-0.35deg"],
        ["5.5s", "-3.3s", "7.5s", "-0.9s", "0.8deg"],
        ["5.1s", "-2.4s", "6.6s", "-1.3s", "-0.6deg"],
        ["5.7s", "-4.1s", "7.8s", "-2.4s", "0.45deg"]
    ];
    const [floatDuration, floatDelay, swayDuration, swayDelay, rotation] = motionPresets[index % motionPresets.length];
    const wrapper = document.createElement("div");
    const link = document.createElement("a");
    const imageWrap = document.createElement("div");
    const image = document.createElement("img");
    const content = document.createElement("div");
    const time = document.createElement("time");
    const title = document.createElement("h2");
    const excerpt = document.createElement("p");
    const readMore = document.createElement("span");
    const arrow = document.createElement("span");
    const date = new Date(post.publishedAt);

    wrapper.className = "newsletter-card-float";
    wrapper.style.setProperty("--float-duration", floatDuration);
    wrapper.style.setProperty("--float-delay", floatDelay);
    wrapper.style.setProperty("--sway-duration", swayDuration);
    wrapper.style.setProperty("--sway-delay", swayDelay);
    wrapper.style.setProperty("--card-rotation", rotation);

    link.className = "newsletter-card";
    link.href = post.url || "https://www.patreon.com/c/PurgaTeam/";
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", `Read ${post.title || "newsletter"} on Patreon`);

    const previewImage = post.previewImage || post.image;

    if (previewImage) {
        imageWrap.className = "newsletter-card__image";
        image.src = previewImage;
        image.alt = "";
        imageWrap.appendChild(image);
        link.appendChild(imageWrap);
    } else {
        link.classList.add("newsletter-card--no-image");
    }

    content.className = "newsletter-card__content";
    if (!Number.isNaN(date.getTime())) {
        time.dateTime = date.toISOString().slice(0, 10);
        time.textContent = new Intl.DateTimeFormat("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric"
        }).format(date);
    }
    title.textContent = post.title || "PurgaTeam Newsletter";
    excerpt.textContent = post.excerpt || "Read the full newsletter on Patreon.";
    readMore.className = "newsletter-card__read-more";
    readMore.append("Read more ");
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "→";
    readMore.appendChild(arrow);

    content.append(time, title, excerpt, readMore);
    link.appendChild(content);
    wrapper.appendChild(link);
    return wrapper;
}

async function loadPatreonNewsletters() {
    if (!newsletterGrid) {
        return;
    }

    try {
        const response = await fetch("patreon-posts.json", { cache: "no-store" });
        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        if (!payload?.ready || !Array.isArray(payload.posts)) {
            return;
        }

        const fragment = document.createDocumentFragment();
        payload.posts.forEach((post, index) => {
            fragment.appendChild(createPatreonNewsletterCard(post, index));
        });
        newsletterGrid.replaceChildren(fragment);
    } catch {
    }
}

async function loadLatestPatreonNewsletterPreview() {
    if (!latestNewsletterPreview) {
        return;
    }

    try {
        const assetRoot = document.body.dataset.assetRoot || "";
        const response = await fetch(`${assetRoot}newsletter/patreon-posts.json`, { cache: "no-store" });
        if (!response.ok) {
            return;
        }

        const payload = await response.json();
        const latestPost = Array.isArray(payload?.posts) ? payload.posts[0] : null;
        if (!latestPost) {
            return;
        }

        const latestNewsletterLink = latestNewsletterPreview.closest(".feed-card--newsletter");
        if (latestNewsletterLink && latestPost.url) {
            latestNewsletterLink.href = latestPost.url;
            latestNewsletterLink.setAttribute("aria-label", `Read ${latestPost.title || "the latest newsletter"} on Patreon`);
        }

        const embedImage = latestPost.embedImage || latestPost.previewImage || latestPost.image;
        if (!embedImage) {
            return;
        }

        const image = document.createElement("img");
        image.src = embedImage;
        image.alt = latestPost.title ? `${latestPost.title} preview` : "Latest PurgaTeam Patreon post preview";
        latestNewsletterPreview.replaceChildren(image);
    } catch {
    }
}

loadLatestPatreonNewsletterPreview();

function initializeNewsletterCarousel() {
    if (!newsletterViewport || !newsletterGrid || !newsletterPreviousButton || !newsletterNextButton) {
        return;
    }

    let newsletterControlFrame;
    let newsletterResizeFrame;
    let newsletterLayoutInitialized = false;
    const newsletterCards = Array.from(newsletterGrid.querySelectorAll(".newsletter-card-float"));

    const updateNewsletterFeaturedCard = () => {
        if (!newsletterCards.length) return;

        const vertical = verticalLayoutQuery.matches;
        const viewportBounds = newsletterViewport.getBoundingClientRect();
        const viewportCenter = vertical ? viewportBounds.top + viewportBounds.height / 2 : viewportBounds.left + viewportBounds.width / 2;
        let closestCard = newsletterCards[0];
        let closestDistance = Number.POSITIVE_INFINITY;

        newsletterCards.forEach((card) => {
            const cardBounds = card.getBoundingClientRect();
            const cardCenter = vertical ? cardBounds.top + cardBounds.height / 2 : cardBounds.left + cardBounds.width / 2;
            const distance = Math.abs(cardCenter - viewportCenter);

            if (distance < closestDistance) {
                closestCard = card;
                closestDistance = distance;
            }
        });

        newsletterCards.forEach((card) => {
            const isFeatured = card === closestCard;
            const cardLink = card.querySelector(".newsletter-card");

            card.classList.toggle("is-featured", isFeatured);
            if (cardLink) {
                cardLink.tabIndex = isFeatured ? 0 : -1;
                cardLink.setAttribute("aria-disabled", String(!isFeatured));
            }
        });
    };

    const centerNewsletterCard = (card, behavior = "auto") => {
        if (!card) return;

        const vertical = verticalLayoutQuery.matches;
        const viewportBounds = newsletterViewport.getBoundingClientRect();
        const cardBounds = card.getBoundingClientRect();
        const distance = vertical ? cardBounds.top + cardBounds.height / 2 - (viewportBounds.top + viewportBounds.height / 2) : cardBounds.left + cardBounds.width / 2 - (viewportBounds.left + viewportBounds.width / 2);
        const maximumScroll = Math.max(0, vertical ? newsletterViewport.scrollHeight - newsletterViewport.clientHeight : newsletterViewport.scrollWidth - newsletterViewport.clientWidth);
        const currentScroll = vertical ? newsletterViewport.scrollTop : newsletterViewport.scrollLeft;
        const targetScroll = Math.min(maximumScroll, Math.max(0, currentScroll + distance));

        newsletterViewport.scrollTo(vertical ? { top: targetScroll, behavior } : { left: targetScroll, behavior });
    };

    const sizeNewsletterCarousel = () => {
        const firstCard = newsletterCards[0];
        if (!firstCard) return;

        const vertical = verticalLayoutQuery.matches;
        const isSingleCard = newsletterCards.length === 1;
        const featuredCard = newsletterCards.find((card) => card.classList.contains("is-featured"));

        if (vertical) {
            const viewportStyles = window.getComputedStyle(newsletterViewport);
            const viewportPadding = Number.parseFloat(viewportStyles.paddingTop) || 0;
            const cardHeight = firstCard.getBoundingClientRect().height;
            const sideInset = Math.max(0, (newsletterViewport.clientHeight - cardHeight) / 2 - viewportPadding);

            newsletterGrid.style.width = "100%";
            newsletterGrid.style.minWidth = "0px";
            newsletterGrid.style.paddingInline = "0px";
            newsletterGrid.style.paddingBlock = isSingleCard ? "0px" : `${sideInset}px`;
            newsletterGrid.style.justifyContent = isSingleCard ? "center" : "flex-start";
            newsletterGrid.style.minHeight = isSingleCard ? "100%" : "0px";
            firstCard.style.marginInline = "auto";
            firstCard.style.marginBlock = isSingleCard ? "auto" : "0px";
        } else {
            const viewportStyles = window.getComputedStyle(newsletterViewport);
            const viewportPadding = Number.parseFloat(viewportStyles.paddingLeft) || 0;
            const cardWidth = firstCard.getBoundingClientRect().width;
            const sideInset = Math.max(0, (newsletterViewport.clientWidth - cardWidth) / 2 - viewportPadding);

            newsletterGrid.style.removeProperty("padding-block");
            newsletterGrid.style.removeProperty("min-height");
            firstCard.style.removeProperty("margin-block");

            if (isSingleCard) {
                newsletterGrid.style.width = "100%";
                newsletterGrid.style.minWidth = "100%";
                newsletterGrid.style.paddingInline = "0px";
                newsletterGrid.style.justifyContent = "center";
                firstCard.style.marginInline = "auto";
            } else {
                newsletterGrid.style.removeProperty("width");
                newsletterGrid.style.removeProperty("min-width");
                newsletterGrid.style.removeProperty("justify-content");
                newsletterGrid.style.paddingInline = `${sideInset}px`;
                firstCard.style.removeProperty("margin-inline");
            }
        }

        window.requestAnimationFrame(() => {
            if (!newsletterLayoutInitialized) {
                newsletterViewport.scrollLeft = 0;
                newsletterViewport.scrollTop = 0;
                if (!isSingleCard) {
                    centerNewsletterCard(firstCard);
                }
                newsletterLayoutInitialized = true;
            } else if (!isSingleCard) {
                centerNewsletterCard(featuredCard);
            }

            updateNewsletterFeaturedCard();
            requestNewsletterControlUpdate();
        });
    };

    const updateNewsletterControls = () => {
        updateNewsletterFeaturedCard();

        const vertical = verticalLayoutQuery.matches;
        const maximumScroll = Math.max(0, vertical ? newsletterViewport.scrollHeight - newsletterViewport.clientHeight : newsletterViewport.scrollWidth - newsletterViewport.clientWidth);
        const hasOverflow = maximumScroll > 3;
        const featuredIndex = Math.max(0, newsletterCards.findIndex((card) => card.classList.contains("is-featured")));
        const hasPreviousCard = featuredIndex > 0;
        const hasNextCard = featuredIndex < newsletterCards.length - 1;
        const isAtStart = !hasOverflow || !hasPreviousCard;
        const isAtEnd = !hasOverflow || !hasNextCard;

        newsletterViewport.classList.toggle("has-overflow", hasOverflow);
        newsletterViewport.classList.toggle("is-at-start", isAtStart);
        newsletterViewport.classList.toggle("is-at-end", isAtEnd);
        newsletterPreviousButton.hidden = isAtStart;
        newsletterNextButton.hidden = isAtEnd;
        newsletterPreviousButton.disabled = isAtStart;
        newsletterNextButton.disabled = isAtEnd;
        newsletterControlFrame = undefined;
    };

    const requestNewsletterControlUpdate = () => {
        if (!newsletterControlFrame) {
            newsletterControlFrame = window.requestAnimationFrame(updateNewsletterControls);
        }
    };

    const moveNewsletterCarousel = (direction) => {
        const featuredIndex = Math.max(0, newsletterCards.findIndex((card) => card.classList.contains("is-featured")));
        const targetIndex = Math.min(newsletterCards.length - 1, Math.max(0, featuredIndex + direction));

        centerNewsletterCard(newsletterCards[targetIndex], prefersLessMotion() ? "auto" : "smooth");
    };

    newsletterPreviousButton.addEventListener("click", () => moveNewsletterCarousel(-1));
    newsletterNextButton.addEventListener("click", () => moveNewsletterCarousel(1));
    newsletterGrid.addEventListener("click", (event) => {
        const selectedCard = event.target.closest(".newsletter-card-float");
        if (selectedCard && !selectedCard.classList.contains("is-featured")) {
            event.preventDefault();
            event.stopPropagation();
        }
    }, true);
    newsletterViewport.addEventListener("scroll", requestNewsletterControlUpdate, { passive: true });
    window.addEventListener("resize", () => {
        if (newsletterResizeFrame) window.cancelAnimationFrame(newsletterResizeFrame);
        newsletterResizeFrame = window.requestAnimationFrame(() => {
            sizeNewsletterCarousel();
            newsletterResizeFrame = undefined;
        });
    });
    window.addEventListener("load", () => {
        requestNewsletterControlUpdate();
    }, { once: true });
    sizeNewsletterCarousel();
    requestNewsletterControlUpdate();
}

if (newsletterGrid) {
    loadPatreonNewsletters().finally(initializeNewsletterCarousel);
} else {
    initializeNewsletterCarousel();
}

// Meet the team section

const teamRosterMembers = Array.from(document.querySelectorAll(".team-roster__member"));
const teamStageVisual = document.querySelector("[data-team-visual]");
const teamStageVisualLayer = teamStageVisual?.closest(".team-stage__visual");
const teamStageContent = document.querySelector(".team-stage__content");
const teamStageName = document.querySelector("[data-team-name]");
const teamStageRole = document.querySelector("[data-team-role]");
const teamStageBio = document.querySelector("[data-team-bio]");
const teamStageSocials = document.querySelector("[data-team-socials]");
const teamStage = document.querySelector(".team-stage");
const teamStageTexture = document.querySelector(".team-stage__texture");
const teamSection = document.querySelector(".team-section");
const teamTitle = document.querySelector("#team-title");
let activeTeamMember = teamRosterMembers.find((member) => member.classList.contains("is-active"));
let isTeamMemberAnimating = false;
let teamSelectionVersion = 0;
let teamSelectionAnimations = [];
let teamSelectionClones = [];

if (teamTitle) {
    const titleText = teamTitle.textContent.trim();
    teamTitle.textContent = "";
    teamTitle.setAttribute("aria-label", titleText);

    Array.from(titleText).forEach((character, characterIndex) => {
        const letter = document.createElement("span");
        letter.className = "team-title__letter";
        letter.setAttribute("aria-hidden", "true");
        letter.style.setProperty("--team-letter-index", characterIndex);
        letter.textContent = character === " " ? "\u00a0" : character;
        teamTitle.append(letter);
    });
}

function updateTeamSectionReveal(currentScrollPosition) {
    if (!teamSection) {
        return;
    }

    if (prefersLessMotion() || !homeFeed) {
        teamSection.classList.add("is-revealed");
        return;
    }

    const latestSectionBottom = homeFeed.offsetTop + homeFeed.offsetHeight;
    const revealPoint = Math.max(0, latestSectionBottom - window.innerHeight * 0.72);

    const shouldReveal = currentScrollPosition >= revealPoint;

    teamSection.classList.toggle("is-revealed", shouldReveal);
}

if (teamStage && teamStageTexture) {
    let checkerFrame;
    let checkerX = 1.2;
    let checkerY = 0.5;
    let targetCheckerX = checkerX;
    let targetCheckerY = checkerY;

    const animateTeamChecker = () => {
        const smoothing = prefersLessMotion() ? 1 : 0.14;
        const bounds = teamStage.getBoundingClientRect();

        checkerX += (targetCheckerX - checkerX) * smoothing;
        checkerY += (targetCheckerY - checkerY) * smoothing;

        teamStageTexture.style.setProperty("--team-checker-x", `${checkerX * bounds.width + 28}px`);
        teamStageTexture.style.setProperty("--team-checker-y", `${checkerY * bounds.height + 28}px`);
        teamStageTexture.style.setProperty("--team-checker-shift-x", prefersLessMotion() ? "0px" : `${(checkerX - 0.5) * 22}px`);
        teamStageTexture.style.setProperty("--team-checker-shift-y", prefersLessMotion() ? "0px" : `${(checkerY - 0.5) * 18}px`);

        if (Math.abs(targetCheckerX - checkerX) > 0.002 || Math.abs(targetCheckerY - checkerY) > 0.002) {
            checkerFrame = window.requestAnimationFrame(animateTeamChecker);
        } else {
            checkerFrame = undefined;
        }
    };

    const requestCheckerFrame = () => {
        if (!checkerFrame) {
            checkerFrame = window.requestAnimationFrame(animateTeamChecker);
        }
    };

    teamStage.addEventListener("pointermove", (event) => {
        if (animationsOff()) return;
        const bounds = teamStage.getBoundingClientRect();
        targetCheckerX = Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width));
        targetCheckerY = Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height));
        requestCheckerFrame();
    });

    teamStage.addEventListener("pointerleave", () => {
        targetCheckerX = 1.2;
        targetCheckerY = 0.5;
        requestCheckerFrame();
    });
}

function createTeamSocialLink(url, icon, label) {
    const link = document.createElement("a");
    const image = document.createElement("img");

    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.setAttribute("aria-label", label);
    image.src = icon;
    image.alt = "";
    image.setAttribute("aria-hidden", "true");
    link.append(image);

    return link;
}

function updateTeamStage(member) {
    const memberName = member.dataset.memberName;
    const socialLinks = [];

    teamStageVisual.src = member.dataset.memberImage;
    teamStageName.textContent = memberName;
    teamStageRole.textContent = member.dataset.memberRole;
    const memberDescription = member.dataset.memberDescription;
    teamStageBio.textContent = memberDescription ?? "More about this member is coming soon.";
    teamStageBio.hidden = memberDescription === "";
    teamStageBio.scrollTop = 0;

    if (member.dataset.memberX) {
        socialLinks.push(createTeamSocialLink(member.dataset.memberX, "media/SVGs/Twitter.svg", `${memberName} on X`));
    }

    if (member.dataset.memberYoutube) {
        socialLinks.push(createTeamSocialLink(member.dataset.memberYoutube, "media/SVGs/YouTube.svg", `${memberName} on YouTube`));
    }

    if (member.dataset.memberInstagram) {
        socialLinks.push(createTeamSocialLink(member.dataset.memberInstagram, "media/SVGs/Instagram.svg", `${memberName} on Instagram`));
    }

    if (member.dataset.memberBluesky) {
        socialLinks.push(createTeamSocialLink(member.dataset.memberBluesky, "media/SVGs/Bluesky.svg", `${memberName} on Bluesky`));
    }

    teamStageSocials.replaceChildren(...socialLinks);
    teamStageSocials.hidden = socialLinks.length === 0;
    teamStageSocials.setAttribute("aria-label", `${memberName} social links`);

}

function updateActiveTeamMember(member) {
    teamRosterMembers.forEach((candidate) => {
        const isSelected = candidate === member;
        candidate.classList.toggle("is-active", isSelected);
        candidate.setAttribute("aria-pressed", String(isSelected));
    });
}

async function selectTeamMember(member) {
    if (member === activeTeamMember || !teamStageVisual || !teamStageVisualLayer || !teamStageContent) {
        return;
    }

    teamSelectionVersion += 1;
    const selectionVersion = teamSelectionVersion;

    teamSelectionAnimations.forEach((animation) => animation.cancel());
    teamSelectionAnimations = [];
    teamSelectionClones.forEach((clone) => clone.remove());
    teamSelectionClones = [];
    teamStageContent.getAnimations().forEach((animation) => animation.cancel());
    teamStageVisual.getAnimations().forEach((animation) => animation.cancel());
    teamStageContent.style.removeProperty("opacity");
    teamStageContent.style.removeProperty("transform");
    teamStageVisual.style.removeProperty("opacity");
    teamStageVisual.style.removeProperty("filter");
    teamStageVisual.style.removeProperty("transform");
    teamStageVisualLayer.style.removeProperty("z-index");

    activeTeamMember = member;
    updateActiveTeamMember(member);

    const swapMember = () => updateTeamStage(member);

    if (prefersLessMotion() || typeof teamStageContent.animate !== "function") {
        swapMember();
        isTeamMemberAnimating = false;
        return;
    }

    isTeamMemberAnimating = true;

    const stageBounds = teamStage.getBoundingClientRect();
    const contentBounds = teamStageContent.getBoundingClientRect();
    const outgoingContent = teamStageContent.cloneNode(true);
    outgoingContent.removeAttribute("aria-live");
    outgoingContent.setAttribute("aria-hidden", "true");
    Object.assign(outgoingContent.style, {
        position: "absolute",
        top: `${contentBounds.top - stageBounds.top}px`,
        left: `${contentBounds.left - stageBounds.left}px`,
        width: `${contentBounds.width}px`,
        height: `${contentBounds.height}px`,
        margin: "0",
        zIndex: "4",
        pointerEvents: "none"
    });
    teamStage.append(outgoingContent);

    const outgoingVisual = teamStageVisualLayer.cloneNode(true);
    const outgoingVisualImage = outgoingVisual.querySelector("[data-team-visual]");
    const visualBounds = teamStageVisualLayer.getBoundingClientRect();
    outgoingVisual.setAttribute("aria-hidden", "true");
    outgoingVisualImage?.removeAttribute("data-team-visual");
    Object.assign(outgoingVisual.style, {
        position: "absolute",
        top: `${visualBounds.top - stageBounds.top}px`,
        left: `${visualBounds.left - stageBounds.left}px`,
        width: `${visualBounds.width}px`,
        height: `${visualBounds.height}px`,
        inset: "auto",
        margin: "0",
        zIndex: "-2",
        background: "transparent",
        pointerEvents: "none"
    });
    teamStage.insertBefore(outgoingVisual, teamStageTexture);
    teamStageVisualLayer.style.zIndex = "-3";
    teamSelectionClones = [outgoingContent, outgoingVisual];

    swapMember();

    const outgoingContentAnimation = outgoingContent.animate(
        [
            { opacity: 1, transform: "translateY(0)" },
            { opacity: 0, transform: "translateY(-68px)" }
        ],
        {
            duration: 300,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards"
        }
    );
    const incomingContentAnimation = teamStageContent.animate(
        [
            { opacity: 0, transform: "translateY(68px)" },
            { opacity: 1, transform: "translateY(0)" }
        ],
        {
            duration: 360,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards"
        }
    );
    const verticalVisualTransition = verticalLayoutQuery.matches;
    const outgoingVisualAnimation = outgoingVisualImage.animate(
        [
            { opacity: 1, filter: "blur(0) saturate(1)", transform: verticalVisualTransition ? "translateY(0)" : "translateX(0)" },
            { opacity: 0, filter: "blur(10px) saturate(1.2)", transform: verticalVisualTransition ? "translateY(-14%)" : "translateX(-14%)" }
        ],
        {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards"
        }
    );
    const incomingVisualAnimation = teamStageVisual.animate(
        [
            { opacity: 0, filter: "blur(12px) saturate(1.3)", transform: verticalVisualTransition ? "translateY(-14%)" : "translateX(-14%)" },
            { opacity: 1, filter: "blur(0) saturate(1)", transform: verticalVisualTransition ? "translateY(0)" : "translateX(0)" }
        ],
        {
            duration: 650,
            easing: "cubic-bezier(0.16, 1, 0.3, 1)",
            fill: "forwards"
        }
    );

    teamSelectionAnimations = [
        outgoingContentAnimation,
        incomingContentAnimation,
        outgoingVisualAnimation,
        incomingVisualAnimation
    ];

    try {
        await Promise.all(teamSelectionAnimations.map((animation) => animation.finished));
    } catch {
        return;
    }

    if (selectionVersion !== teamSelectionVersion) {
        return;
    }

    teamSelectionAnimations.forEach((animation) => animation.cancel());
    teamSelectionAnimations = [];
    teamSelectionClones.forEach((clone) => clone.remove());
    teamSelectionClones = [];
    teamStageVisualLayer.style.removeProperty("z-index");
    isTeamMemberAnimating = false;
}

teamRosterMembers.forEach((member) => {
    new Image().src = member.dataset.memberImage;

    member.addEventListener("click", () => selectTeamMember(member));
});

if (activeTeamMember && teamStageVisual && teamStageContent) {
    updateTeamStage(activeTeamMember);
}

function updatePageSecondaryHeader(currentScrollPosition) {
    if (!pageSecondaryHeader) {
        return;
    }

    if (animationsOff() && (homeFeed || document.body.classList.contains("projects-page"))) {
        pageSecondaryHeader.classList.remove("is-content-hidden");
        return;
    }

    if (currentScrollPosition > 64) {
        pageSecondaryHeader.classList.add("is-content-hidden");
    } else if (currentScrollPosition < 20) {
        pageSecondaryHeader.classList.remove("is-content-hidden");
    }
}

function updateHeaderVisibility() {
    const currentScrollPosition = window.scrollY;
    const scrollDifference = currentScrollPosition - lastScrollPosition;

    if (currentScrollPosition > secondaryCollapsePoint && !header.classList.contains("secondary-collapsed")) {
        header.classList.add("secondary-collapsed");
        navigationCanHide = false;
        clearTimeout(secondaryCollapseTimer);
        secondaryCollapseTimer = setTimeout(() => {
            navigationCanHide = true;
        }, secondaryTransitionDuration);
    } else if (currentScrollPosition < secondaryRevealPoint && header.classList.contains("secondary-collapsed")) {
        header.classList.remove("secondary-collapsed");
        header.classList.remove("nav-hidden");
        navigationCanHide = false;
        clearTimeout(secondaryCollapseTimer);
    }

    if (documentRoot.classList.contains("primary-header-forced-hidden")) {
        header.classList.add("nav-hidden");
        closePrimaryNavigation();
    } else if (!navigationCanHide || !header.classList.contains("secondary-collapsed")) {
        header.classList.remove("nav-hidden");
    } else if (scrollDifference > 4) {
        header.classList.add("nav-hidden");
        closePrimaryNavigation();
    } else if (scrollDifference < -4) {
        header.classList.remove("nav-hidden");
    }

    if (Math.abs(scrollDifference) > 4 || currentScrollPosition <= secondaryRevealPoint) {
        lastScrollPosition = currentScrollPosition;
    }

    updateHomeFeedEffects(currentScrollPosition);
    updateNewsletterArchiveEffects(currentScrollPosition);
    updatePageSecondaryHeader(currentScrollPosition);

    scrollFrameRequested = false;
}

window.addEventListener("scroll", () => {
    if (!scrollFrameRequested) {
        window.requestAnimationFrame(updateHeaderVisibility);
        scrollFrameRequested = true;
    }
}, { passive: true });

updateHomeFeedEffects(window.scrollY);
updateNewsletterArchiveEffects(window.scrollY);
updatePageSecondaryHeader(window.scrollY);

const showcaseBackgrounds = Array.from(document.querySelectorAll(".ambition-showcase__background"));
const assetRoot = document.body.dataset.assetRoot || "";
const screenshotSources = [
    `${assetRoot}media/Images/Screenshots/3.png`,
    `${assetRoot}media/Images/Screenshots/4.png`,
    `${assetRoot}media/Images/Screenshots/5.png`,
    `${assetRoot}media/Images/Screenshots/6.png`
];

screenshotSources.forEach((source) => {
    const screenshot = new Image();
    screenshot.src = source;
});

if (showcaseBackgrounds.length === 2 && !reducedMotionQuery.matches) {
    let activeBackgroundIndex = 0;
    let activeScreenshotIndex = 0;
    let transitionInProgress = false;

    window.setInterval(() => {
        if (transitionInProgress) {
            return;
        }

        transitionInProgress = true;

        const currentBackground = showcaseBackgrounds[activeBackgroundIndex];
        const nextBackgroundIndex = activeBackgroundIndex === 0 ? 1 : 0;
        const nextBackground = showcaseBackgrounds[nextBackgroundIndex];

        activeScreenshotIndex = (activeScreenshotIndex + 1) % screenshotSources.length;
        nextBackground.style.backgroundImage = `url("${screenshotSources[activeScreenshotIndex]}")`;

        nextBackground.classList.remove("is-zooming");
        void nextBackground.offsetWidth;

        currentBackground.classList.add("is-extra-blurred");
        nextBackground.classList.add("is-extra-blurred");
        nextBackground.classList.add("is-active");
        if (!animationsOff()) {
            nextBackground.classList.add("is-zooming");
        }
        currentBackground.classList.remove("is-active");

        window.setTimeout(() => {
            nextBackground.classList.remove("is-extra-blurred");
            currentBackground.classList.remove("is-extra-blurred", "is-zooming");
            activeBackgroundIndex = nextBackgroundIndex;
            transitionInProgress = false;
        }, 900);
    }, 5000);
}

const latestVideo = document.querySelector(".latest-video");

if (latestVideo) {
    const videoEmbed = latestVideo.querySelector("iframe");
    const embedUrl = videoEmbed ? new URL(videoEmbed.src) : null;
    const videoId = embedUrl?.pathname.split("/").filter(Boolean).pop();
    const videoUrl = videoId ? `https://www.youtube.com/watch?v=${encodeURIComponent(videoId)}` : null;

    function applyVideoTitle(metadata) {
        if (metadata?.title?.trim()) {
            videoEmbed.title = metadata.title.trim();
        }
    }

    async function fetchJsonWithTimeout(url, timeout = 5000) {
        const controller = new AbortController();
        const timeoutId = window.setTimeout(() => controller.abort(), timeout);

        try {
            const response = await fetch(url, { signal: controller.signal });

            if (!response.ok) {
                throw new Error(`Metadata request failed with ${response.status}`);
            }

            return await response.json();
        } finally {
            window.clearTimeout(timeoutId);
        }
    }

    async function refreshVideoMetadata() {
        if (!videoUrl) {
            return;
        }

        try {
            const embedMetadata = await fetchJsonWithTimeout(`https://noembed.com/embed?url=${encodeURIComponent(videoUrl)}`);
            applyVideoTitle(embedMetadata);
        } catch {
            // The exact title already in the page remains available offline.
        }
    }

    refreshVideoMetadata();
}

// latest vid

const projectsIntroChecker = document.querySelector(".projects-intro__checker");
const projectsIntro = document.querySelector(".projects-intro");
const projectsTitle = document.querySelector(".projects-intro h1");
const projectsMain = document.querySelector(".projects-main");
const projectsCatalog = document.querySelector(".projects-catalog");
const projectsCategorySelector = document.querySelector(".projects-category-selector");
let projectsPointerClientX = 0;
let projectsPointerClientY = 0;
let projectsAutoCentered = false;
let projectsAutoCenterFrame = 0;
let projectsFocusStart = null;
let projectsFocusEnd = null;
let projectsHeaderHidden = false;

// projects page

if (projectsIntro && projectsTitle) {
    const titleText = projectsTitle.textContent.trim();
    const titleFragment = document.createDocumentFragment();

    projectsTitle.setAttribute("aria-label", titleText);

    Array.from(titleText).forEach((character) => {
        const letter = document.createElement("span");
        letter.className = "project-title__letter";
        letter.setAttribute("aria-hidden", "true");

        if (character === " ") {
            letter.classList.add("project-title__letter--space");
            letter.textContent = "\u00a0";
        } else {
            letter.textContent = character;
        }

        titleFragment.append(letter);
    });

    projectsTitle.replaceChildren(titleFragment);

    const titleLetters = Array.from(projectsTitle.querySelectorAll(".project-title__letter"));
    let titlePointerFrame = 0;

    const renderTitleProximity = () => {
        titlePointerFrame = 0;
        const pointerRadius = Math.max(220, Math.min(340, window.innerWidth * 0.2));

        let strongestProximity = 0;

        titleLetters.forEach((letter) => {
            const bounds = letter.getBoundingClientRect();
            const distance = Math.hypot(projectsPointerClientX - (bounds.left + bounds.width * 0.5), projectsPointerClientY - (bounds.top + bounds.height * 0.5));
            const proximity = Math.max(0, 1 - (distance / pointerRadius));
            const easedProximity = proximity * proximity * (3 - (2 * proximity));
            strongestProximity = Math.max(strongestProximity, easedProximity);

            letter.style.setProperty("--project-letter-scale", `${1 + easedProximity * 0.2}`);
            letter.style.setProperty("--project-letter-lift", `${easedProximity * -3}px`);
            letter.style.setProperty("--project-letter-glow-size", `${easedProximity * 34}px`);
            letter.style.setProperty("--project-letter-glow-opacity", `${easedProximity * 0.82}`);
        });

        projectsTitle.style.setProperty("--project-title-accent-scale", `${1 + strongestProximity * 0.2}`);
        projectsTitle.style.setProperty("--project-title-accent-glow", `${strongestProximity * 22}px`);
    };

    document.addEventListener("pointermove", (event) => {
        if (animationsOff() || event.pointerType === "touch" || verticalLayoutQuery.matches) {
            return;
        }

        projectsPointerClientX = event.clientX;
        projectsPointerClientY = event.clientY;

        if (!titlePointerFrame) {
            titlePointerFrame = window.requestAnimationFrame(renderTitleProximity);
        }
    });

}

function updateProjectsParallax() {
    if (!projectsIntroChecker || !projectsMain) {
        return;
    }

    if (animationsOff()) {
        if (projectsAutoCenterFrame) {
            window.cancelAnimationFrame(projectsAutoCenterFrame);
            projectsAutoCenterFrame = 0;
        }
        projectsAutoCentered = false;
        projectsFocusStart = null;
        projectsFocusEnd = null;
        projectsMain.style.removeProperty("--checker-parallax");
        projectsMain.style.removeProperty("--projects-scroll-parallax");
        projectsMain.style.removeProperty("--projects-intro-live-height");
        projectsMain.style.removeProperty("--projects-intro-height");
        projectsMain.style.removeProperty("--projects-reveal-progress");
        projectsMain.style.removeProperty("--projects-focus-shift");
        projectsMain.style.removeProperty("--projects-title-opacity");
        projectsMain.style.removeProperty("--projects-title-scale");
        projectsMain.style.removeProperty("--projects-pattern-opacity");
        projectsMain.style.removeProperty("--projects-focus-overlay");
        projectsMain.style.removeProperty("--projects-list-parallax");
        document.body.classList.remove("projects-list-visible");
        if (projectsHeaderHidden) {
            projectsHeaderHidden = false;
            releasePrimaryHeaderVisibilityLock();
        }
        projectsTitle?.style.removeProperty("--project-title-accent-scale");
        projectsTitle?.style.removeProperty("--project-title-accent-glow");
        projectsTitle?.querySelectorAll(".project-title__letter").forEach((letter) => {
            letter.style.removeProperty("--project-letter-scale");
            letter.style.removeProperty("--project-letter-lift");
            letter.style.removeProperty("--project-letter-glow-size");
            letter.style.removeProperty("--project-letter-glow-opacity");
        });
        return;
    }

    const parallaxOffset = reducedMotionQuery.matches ? 0 : window.scrollY * 0.5;
    projectsMain.style.setProperty("--checker-parallax", `${parallaxOffset}px`);
    projectsMain.style.setProperty("--projects-scroll-parallax", `${parallaxOffset}px`);

    const catalogBounds = projectsCatalog?.getBoundingClientRect();

    if (catalogBounds) {
        const catalogDocumentTop = catalogBounds.top + window.scrollY;
        const collapsedIntroHeight = window.innerWidth <= 860 ? 228 : 280;
        const expandedIntroHeight = window.innerWidth <= 860 ? Math.max(360, Math.min(500, window.innerHeight * 0.5)) : Math.max(440, Math.min(600, window.innerHeight * 0.54));

        if (projectsFocusStart === null || projectsFocusEnd === null) {
            const compactCatalogTop = catalogDocumentTop - (expandedIntroHeight - collapsedIntroHeight);
            const categoryBounds = projectsCategorySelector?.getBoundingClientRect();
            const sectionSpan = categoryBounds ? (categoryBounds.bottom + window.scrollY) - catalogDocumentTop : catalogBounds.height;
            const centeredDestination = compactCatalogTop + ((sectionSpan - window.innerHeight) * 0.5) - 64;
            projectsFocusStart = 0;
            const fullTransitionDistance = Math.max(1, Math.min(compactCatalogTop - window.innerHeight * 0.15, centeredDestination - 24));
            projectsFocusEnd = Math.max(1, fullTransitionDistance * 0.375);
        }

        const focusProgress = Math.max(0, Math.min(1, (window.scrollY - projectsFocusStart) / Math.max(1, projectsFocusEnd - projectsFocusStart)));
        const liveIntroHeight = expandedIntroHeight - ((expandedIntroHeight - collapsedIntroHeight) * focusProgress);

        projectsMain.style.setProperty("--projects-intro-live-height", `${liveIntroHeight}px`);
        projectsMain.style.setProperty("--projects-intro-height", `${liveIntroHeight}px`);
        projectsMain.style.setProperty("--projects-reveal-progress", `${focusProgress}`);
        projectsMain.style.setProperty("--projects-focus-shift", "0px");
        projectsMain.style.setProperty("--projects-title-opacity", `${1 - focusProgress}`);
        projectsMain.style.setProperty("--projects-title-scale", `${1 - focusProgress * 0.16}`);
        projectsMain.style.setProperty("--projects-pattern-opacity", `${0.26 * (1 - focusProgress)}`);
        projectsMain.style.setProperty("--projects-focus-overlay", `rgba(20, 9, 14, ${focusProgress})`);
        document.body.classList.toggle("projects-list-visible", focusProgress > 0.01);

        if (focusProgress < 0.15) {
            projectsAutoCentered = false;
            if (projectsHeaderHidden) {
                projectsHeaderHidden = false;
                releasePrimaryHeaderVisibilityLock();
            }
        } else if (focusProgress >= 0.82 && !projectsHeaderHidden) {
            projectsHeaderHidden = true;
            holdPrimaryHeaderHidden();
        }

        if (!verticalLayoutQuery.matches && focusProgress >= 0.999 && !projectsAutoCentered && projectsCategorySelector) {
            projectsAutoCentered = true;

            if (projectsAutoCenterFrame) {
                window.cancelAnimationFrame(projectsAutoCenterFrame);
            }

            projectsAutoCenterFrame = window.requestAnimationFrame(() => {
                projectsAutoCenterFrame = 0;

                const settledCatalogBounds = projectsCatalog.getBoundingClientRect();
                const categoryBounds = projectsCategorySelector.getBoundingClientRect();
                const sectionTop = settledCatalogBounds.top + window.scrollY;
                const sectionBottom = categoryBounds.bottom + window.scrollY;
                const centeredTop = sectionTop + ((sectionBottom - sectionTop) - window.innerHeight) * 0.5 - 64;
                const maximumScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
                const targetScroll = Math.max(0, Math.min(maximumScroll, centeredTop));

                if (Math.abs(window.scrollY - targetScroll) > 2) {
                    window.scrollTo({
                        top: targetScroll,
                        behavior: reducedMotionQuery.matches ? "auto" : "smooth"
                    });
                }
            });
        }

        const distanceFromCenter = (window.innerHeight * 0.5) - (catalogBounds.top + catalogBounds.height * 0.5);
        const listParallaxOffset = reducedMotionQuery.matches ? 0 : Math.max(-90, Math.min(90, distanceFromCenter * 0.16));

        projectsMain.style.setProperty("--projects-list-parallax", `${listParallaxOffset}px`);
    }
}

if (projectsIntroChecker) {
    window.addEventListener("scroll", () => {
        window.requestAnimationFrame(updateProjectsParallax);
    }, { passive: true });
    window.addEventListener("resize", () => {
        window.requestAnimationFrame(updateProjectsParallax);
    });
    updateProjectsParallax();
}

document.querySelectorAll("[data-project-carousel]").forEach((carousel) => {
    const viewport = carousel.querySelector("[data-project-viewport]");

    if (!viewport) {
        return;
    }

    let hoverPanFrame = 0;
    let hoverPanVelocity = 0;
    let hoverPanTimestamp = 0;

    const stopProjectHoverPan = () => {
        hoverPanVelocity = 0;
        hoverPanTimestamp = 0;

        if (hoverPanFrame) {
            window.cancelAnimationFrame(hoverPanFrame);
            hoverPanFrame = 0;
        }
    };

    const runProjectHoverPan = (timestamp) => {
        if (!hoverPanVelocity || verticalLayoutQuery.matches) {
            stopProjectHoverPan();
            return;
        }

        if (!hoverPanTimestamp) {
            hoverPanTimestamp = timestamp;
        }

        const elapsed = Math.min(32, timestamp - hoverPanTimestamp);
        const maximumScroll = Math.max(0, viewport.scrollWidth - viewport.clientWidth);
        hoverPanTimestamp = timestamp;
        viewport.scrollLeft = Math.max(0, Math.min(maximumScroll, viewport.scrollLeft + hoverPanVelocity * (elapsed / 1000)));
        hoverPanFrame = window.requestAnimationFrame(runProjectHoverPan);
    };

    const requestProjectHoverPan = () => {
        if (!hoverPanFrame && hoverPanVelocity) {
            hoverPanFrame = window.requestAnimationFrame(runProjectHoverPan);
        }
    };

    carousel.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch" || verticalLayoutQuery.matches) {
            stopProjectHoverPan();
            return;
        }

        if (viewport.scrollWidth <= viewport.clientWidth + 1) {
            stopProjectHoverPan();
            return;
        }

        const bounds = carousel.getBoundingClientRect();
        const pointerX = Math.max(0, Math.min(bounds.width, event.clientX - bounds.left));
        const normalizedPosition = ((pointerX / Math.max(1, bounds.width)) - 0.5) * 2;
        const deadZone = 0.18;
        const distanceFromCenter = Math.abs(normalizedPosition);

        if (distanceFromCenter <= deadZone) {
            stopProjectHoverPan();
            return;
        }

        const intensity = Math.pow(Math.min(1, (distanceFromCenter - deadZone) / (1 - deadZone)), 1.65);
        hoverPanVelocity = Math.sign(normalizedPosition) * 1100 * intensity;
        requestProjectHoverPan();
    });

    carousel.addEventListener("pointerleave", stopProjectHoverPan);
    window.addEventListener("resize", () => {
        if (verticalLayoutQuery.matches) {
            stopProjectHoverPan();
        }
    });
});

const projectFilterButtons = Array.from(document.querySelectorAll("[data-project-filter]"));
const projectFilterPanels = Array.from(document.querySelectorAll(".projects-page .project-panel[data-project-type]"));
const projectEmptyPanel = document.querySelector(".projects-page .project-panel--empty");
const projectFilterViewport = document.querySelector(".projects-page [data-project-viewport]");

if (projectFilterButtons.length && projectFilterPanels.length && projectFilterViewport) {
    const setProjectFilterButtonState = (filterName) => {
        projectFilterButtons.forEach((button) => {
            const isActive = button.dataset.projectFilter === filterName;
            button.classList.toggle("is-active", isActive);
            button.setAttribute("aria-pressed", String(isActive));
        });
    };

    const applyProjectFilter = (filterName, shouldAnimate = true) => {
        setProjectFilterButtonState(filterName);

        projectFilterPanels.forEach((panel) => {
            const isVisible = panel.dataset.projectType === filterName;
            panel.classList.toggle("is-filtered-out", !isVisible);
            panel.setAttribute("aria-hidden", String(!isVisible));

            if (isVisible) {
                panel.removeAttribute("tabindex");
            } else {
                panel.setAttribute("tabindex", "-1");
            }
        });

        if (projectEmptyPanel) {
            projectEmptyPanel.classList.toggle("is-filtered-out", filterName !== "collective");
        }

        projectFilterViewport.scrollTo({
            left: 0,
            top: 0,
            behavior: shouldAnimate && !prefersLessMotion() ? "smooth" : "auto"
        });

        window.requestAnimationFrame(() => {
            projectFilterViewport.dispatchEvent(new Event("scroll"));
        });
    };

    let isProjectFilterTransitioning = false;

    const transitionProjectFilter = async (filterName) => {
        const currentButton = projectFilterButtons.find((button) => button.classList.contains("is-active"));

        if (isProjectFilterTransitioning || currentButton?.dataset.projectFilter === filterName) {
            return;
        }

        if (prefersLessMotion() || typeof projectFilterViewport.animate !== "function") {
            applyProjectFilter(filterName, false);
            return;
        }

        isProjectFilterTransitioning = true;
        setProjectFilterButtonState(filterName);
        projectFilterViewport.setAttribute("aria-busy", "true");

        try {
            const outgoingPanels = Array.from(projectFilterViewport.querySelectorAll(".project-panel:not(.is-filtered-out)"));
            const outgoingBounds = outgoingPanels.map((panel) => panel.getBoundingClientRect());
            const viewportBounds = projectFilterViewport.getBoundingClientRect();
            const verticalTransition = verticalLayoutQuery.matches;
            const outgoingTarget = verticalTransition ? viewportBounds.top - Math.max(...outgoingBounds.map((bounds) => bounds.height)) - 48 : viewportBounds.left - Math.max(...outgoingBounds.map((bounds) => bounds.width)) - 48;
            const outgoingAnimations = outgoingPanels.map((panel, index) => {
                const foldDistance = outgoingTarget - (verticalTransition ? outgoingBounds[index].top : outgoingBounds[index].left);

                return panel.animate(
                    [
                        { transform: verticalTransition ? "perspective(1200px) translate3d(0, 0, 0) rotateX(0deg)" : "perspective(1200px) translate3d(0, 0, 0) rotateY(0deg)" },
                        { transform: verticalTransition ? `perspective(1200px) translate3d(0, ${foldDistance}px, 0) rotateX(34deg)` : `perspective(1200px) translate3d(${foldDistance}px, 0, 0) rotateY(-34deg)` }
                    ],
                    {
                        duration: 430,
                        delay: (outgoingPanels.length - index - 1) * 38,
                        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                        fill: "forwards"
                    }
                );
            });

            await Promise.all(outgoingAnimations.map((animation) => animation.finished));
            applyProjectFilter(filterName, false);

            outgoingAnimations.forEach((animation) => animation.cancel());

            const incomingPanels = Array.from(projectFilterViewport.querySelectorAll(".project-panel:not(.is-filtered-out)"));
            const incomingBounds = incomingPanels.map((panel) => panel.getBoundingClientRect());
            const incomingTarget = verticalTransition ? viewportBounds.top - Math.max(...incomingBounds.map((bounds) => bounds.height)) - 48 : viewportBounds.left - Math.max(...incomingBounds.map((bounds) => bounds.width)) - 48;
            const incomingTransforms = incomingBounds.map((bounds) => verticalTransition ? `perspective(1200px) translate3d(0, ${incomingTarget - bounds.top}px, 0) rotateX(34deg)` : `perspective(1200px) translate3d(${incomingTarget - bounds.left}px, 0, 0) rotateY(-34deg)`);

            incomingPanels.forEach((panel, index) => {
                panel.style.transform = incomingTransforms[index];
            });

            await new Promise((resolve) => window.requestAnimationFrame(resolve));

            const incomingAnimations = incomingPanels.map((panel, index) => panel.animate(
                [
                    { transform: incomingTransforms[index] },
                    { transform: verticalTransition ? "perspective(1200px) translate3d(0, 0, 0) rotateX(0deg)" : "perspective(1200px) translate3d(0, 0, 0) rotateY(0deg)" }
                ],
                {
                    duration: 560,
                    delay: index * 46,
                    easing: "cubic-bezier(0.16, 1, 0.3, 1)",
                    fill: "forwards"
                }
            ));

            await Promise.all(incomingAnimations.map((animation) => animation.finished));
            incomingAnimations.forEach((animation) => animation.cancel());
            incomingPanels.forEach((panel) => {
                panel.style.removeProperty("transform");
            });
        } catch {
            applyProjectFilter(filterName, false);
        } finally {
            projectFilterViewport.querySelectorAll(".project-panel").forEach((panel) => {
                panel.style.removeProperty("transform");
            });
            projectFilterViewport.removeAttribute("aria-busy");
            isProjectFilterTransitioning = false;
        }
    };

    projectFilterButtons.forEach((button) => {
        button.addEventListener("click", () => transitionProjectFilter(button.dataset.projectFilter));
    });

    applyProjectFilter("games", false);
}

document.querySelectorAll("[data-project-placeholder]").forEach((projectPanel) => {
    projectPanel.addEventListener("click", (event) => event.preventDefault());
});

document.querySelectorAll(".project-platform-button").forEach((platformButton) => {
    let tiltFrame = 0;
    let pointerX = 0;
    let pointerY = 0;

    const resetPlatformTilt = () => {
        if (tiltFrame) {
            window.cancelAnimationFrame(tiltFrame);
            tiltFrame = 0;
        }

        platformButton.classList.remove("is-tilting");
        platformButton.style.removeProperty("--platform-tilt-x");
        platformButton.style.removeProperty("--platform-tilt-y");
    };

    const updatePlatformTilt = () => {
        tiltFrame = 0;

        if (reducedMotionQuery.matches) {
            resetPlatformTilt();
            return;
        }

        const panelBounds = platformButton.getBoundingClientRect();
        const normalizedX = Math.max(-1, Math.min(1, (pointerX - panelBounds.left - panelBounds.width / 2) / Math.max(1, panelBounds.width / 2)));
        const normalizedY = Math.max(-1, Math.min(1, (pointerY - panelBounds.top - panelBounds.height / 2) / Math.max(1, panelBounds.height / 1.2)));
        platformButton.classList.add("is-tilting");
        platformButton.style.setProperty("--platform-tilt-x", `${(-normalizedY * 18).toFixed(2)}deg`);
        platformButton.style.setProperty("--platform-tilt-y", `${(normalizedX * 22).toFixed(2)}deg`);
    };

    platformButton.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") {
            return;
        }

        pointerX = event.clientX;
        pointerY = event.clientY;

        if (!tiltFrame) {
            tiltFrame = window.requestAnimationFrame(updatePlatformTilt);
        }
    });
    platformButton.addEventListener("pointerleave", resetPlatformTilt);
    reducedMotionQuery.addEventListener("change", resetPlatformTilt);
});

// MLC

const mlcTerminal = document.querySelector(".mlc-terminal");
const mlcTerminalBoot = mlcTerminal?.querySelector("[data-terminal-boot]");

if (mlcTerminalBoot) {
    const bootPanel = mlcTerminalBoot.querySelector(".mlc-terminal__boot-panel");
    const bootTitle = mlcTerminalBoot.querySelector("[data-terminal-boot-title]");
    const bootMessage = mlcTerminalBoot.querySelector("[data-terminal-boot-message]");
    const bootCorners = Array.from(mlcTerminalBoot.querySelectorAll(".mlc-terminal__boot-corner"));
    const bootContinue = mlcTerminalBoot.querySelector("[data-terminal-boot-continue]");
    const bootClose = mlcTerminalBoot.querySelector("[data-terminal-boot-close]");
    const attentionText = bootTitle?.textContent || "ATTENTION !!!";
    const bootWait = (duration) => new Promise((resolve) => window.setTimeout(resolve, duration));
    const randomBootDuration = (minimum, maximum) => minimum + Math.random() * (maximum - minimum);
    const capturedBootMessageNodes = [];
    let bootStarted = false;
    let bootExiting = false;
    let bootCancelled = false;
    let lockedTerminalScrollY = 0;
    let terminalResumeScrollY = 0;
    let lockedBodyStyles = null;

    document.documentElement.classList.add("terminal-boot-enhanced");
    mlcTerminalBoot.setAttribute("aria-busy", "false");

    if (bootTitle) {
        bootTitle.textContent = "";
    }

    if (bootMessage) {
        const messageWalker = document.createTreeWalker(bootMessage, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });

        while (messageWalker.nextNode()) {
            capturedBootMessageNodes.push({
                node: messageWalker.currentNode,
                text: messageWalker.currentNode.nodeValue
            });
        }

        capturedBootMessageNodes.forEach(({ node }) => {
            node.nodeValue = "";
        });
    }

    const lockTerminalScroll = (scrollPosition) => {
        const scrollbarWidth = Math.max(0, window.innerWidth - document.documentElement.clientWidth);
        const bodyStyle = document.body.style;
        lockedTerminalScrollY = Math.max(0, Math.round(scrollPosition));
        lockedBodyStyles = {
            position: bodyStyle.position,
            top: bodyStyle.top,
            right: bodyStyle.right,
            left: bodyStyle.left,
            width: bodyStyle.width
        };

        document.documentElement.style.setProperty("--terminal-scrollbar-compensation", `${scrollbarWidth}px`);
        document.documentElement.classList.add("terminal-scroll-locked");
        bodyStyle.position = "fixed";
        bodyStyle.top = `${-lockedTerminalScrollY}px`;
        bodyStyle.right = "0";
        bodyStyle.left = "0";
        bodyStyle.width = "100%";
    };

    const unlockTerminalScroll = () => {
        const bodyStyle = document.body.style;
        const documentStyle = document.documentElement.style;
        const previousScrollBehavior = documentStyle.scrollBehavior;

        if (lockedBodyStyles) {
            bodyStyle.position = lockedBodyStyles.position;
            bodyStyle.top = lockedBodyStyles.top;
            bodyStyle.right = lockedBodyStyles.right;
            bodyStyle.left = lockedBodyStyles.left;
            bodyStyle.width = lockedBodyStyles.width;
            lockedBodyStyles = null;
        }

        document.documentElement.classList.remove("terminal-scroll-locked");
        document.documentElement.style.removeProperty("--terminal-scrollbar-compensation");
        documentStyle.scrollBehavior = "auto";
        window.scrollTo(0, terminalResumeScrollY);

        if (previousScrollBehavior) {
            documentStyle.scrollBehavior = previousScrollBehavior;
        } else {
            documentStyle.removeProperty("scroll-behavior");
        }
    };

    const typeAttentionText = async () => {
        if (!bootTitle) {
            return;
        }

        for (let index = 1; index <= attentionText.length; index += 1) {
            if (bootCancelled) {
                return;
            }

            bootTitle.textContent = attentionText.slice(0, index);
            await bootWait(46);
        }
    };

    const restoreBootMessage = () => {
        capturedBootMessageNodes.forEach(({ node, text }) => {
            node.nodeValue = text;
        });
    };

    const typeBootMessage = async () => {
        for (const { node, text } of capturedBootMessageNodes) {
            for (let index = 2; index < text.length + 2; index += 2) {
                if (bootCancelled) {
                    return;
                }

                node.nodeValue = text.slice(0, index);
                await bootWait(9);
            }
        }
    };

    const flickerBootElement = async (element, duration, settings = {}) => {
        if (!element) {
            return;
        }

        const offMinimum = settings.offMinimum ?? 26;
        const offMaximum = settings.offMaximum ?? 58;
        const onMinimum = settings.onMinimum ?? 68;
        const onMaximum = settings.onMaximum ?? 156;
        const endTime = performance.now() + duration;

        await bootWait(randomBootDuration(18, 92));

        while (performance.now() < endTime && !bootCancelled) {
            element.classList.add("is-flicker-off");
            await bootWait(randomBootDuration(offMinimum, offMaximum));
            element.classList.remove("is-flicker-off");
            await bootWait(randomBootDuration(onMinimum, onMaximum));
        }

        element.classList.remove("is-flicker-off");
    };

    const finishTerminalBoot = () => {
        if (mlcTerminalBoot.classList.contains("is-complete")) {
            return;
        }

        mlcTerminalBoot.classList.add("is-complete");
        mlcTerminalBoot.setAttribute("aria-busy", "false");
        mlcTerminal.classList.add("is-boot-complete");
        unlockTerminalScroll();
        releasePrimaryHeaderVisibilityLock();
        mlcTerminal.dispatchEvent(new CustomEvent("mlc-terminal-boot-complete"));
        window.dispatchEvent(new Event("mlc-terminal-layoutchange"));
    };

    const cancelTerminalBoot = () => {
        if (mlcTerminalBoot.classList.contains("is-complete")) {
            return;
        }

        bootCancelled = true;
        bootExiting = true;
        window.removeEventListener("scroll", checkTerminalBootPosition);
        window.removeEventListener("resize", checkTerminalBootPosition);
        finishTerminalBoot();
    };

    const exitTerminalBoot = async () => {
        if (bootExiting || !mlcTerminalBoot.classList.contains("is-ready")) {
            return;
        }

        bootExiting = true;
        mlcTerminalBoot.classList.add("is-exiting", "is-exit-black");
        await bootWait(120);
        mlcTerminalBoot.classList.remove("is-exit-black");
        mlcTerminalBoot.classList.add("is-exit-orange");
        await bootWait(145);
        mlcTerminalBoot.classList.remove("is-exit-orange", "is-orange");
        mlcTerminalBoot.classList.add("is-exit-final");
        await bootWait(170);
        finishTerminalBoot();
    };

    const runTerminalBoot = async () => {
        if (bootStarted) {
            return;
        }

        bootStarted = true;
        window.removeEventListener("scroll", checkTerminalBootPosition);
        window.removeEventListener("resize", checkTerminalBootPosition);
        holdPrimaryHeaderHidden();

        const bootBounds = mlcTerminalBoot.getBoundingClientRect();
        const documentStyle = document.documentElement.style;
        const previousScrollBehavior = documentStyle.scrollBehavior;
        const safeTerminalInset = Math.round(Math.min(112, Math.max(76, window.innerHeight * 0.095)));
        terminalResumeScrollY = Math.max(0, Math.round(window.scrollY + bootBounds.top));
        const targetScrollY = Math.max(0, terminalResumeScrollY + safeTerminalInset);
        documentStyle.scrollBehavior = "auto";
        window.scrollTo(0, targetScrollY);

        if (bootPanel) {
            bootPanel.style.setProperty("--terminal-boot-viewport-offset", `${safeTerminalInset}px`);
        }

        lockTerminalScroll(targetScrollY);

        if (previousScrollBehavior) {
            documentStyle.scrollBehavior = previousScrollBehavior;
        } else {
            documentStyle.removeProperty("scroll-behavior");
        }

        mlcTerminalBoot.classList.add("is-running");
        mlcTerminalBoot.setAttribute("aria-busy", "true");

        if (reducedMotionQuery.matches) {
            if (bootTitle) {
                bootTitle.textContent = attentionText;
            }
            restoreBootMessage();
            mlcTerminalBoot.classList.add("is-orange", "is-title-active", "is-title-condensed", "is-framed", "is-message-visible", "is-ready");
            return;
        }

        mlcTerminalBoot.classList.add("is-flash-orange");
        await bootWait(95);
        if (bootCancelled) return;
        mlcTerminalBoot.classList.remove("is-flash-orange");
        await bootWait(90);
        if (bootCancelled) return;
        mlcTerminalBoot.classList.add("is-orange");
        await bootWait(120);
        if (bootCancelled) return;

        mlcTerminalBoot.classList.add("is-title-active");
        window.requestAnimationFrame(() => {
            mlcTerminalBoot.classList.add("is-title-condensed");
        });
        await Promise.all([
            typeAttentionText(),
            bootWait(960),
            flickerBootElement(bootTitle, 860, {
                offMinimum: 24,
                offMaximum: 52,
                onMinimum: 52,
                onMaximum: 132
            })
        ]);
        if (bootCancelled) return;

        mlcTerminalBoot.classList.add("is-framed");
        await Promise.all(bootCorners.map((corner, index) => flickerBootElement(
            corner,
            randomBootDuration(480, 650) + index * 36,
            {
                offMinimum: 28,
                offMaximum: 62,
                onMinimum: 72,
                onMaximum: 170
            }
        )));
        if (bootCancelled) return;
        mlcTerminalBoot.classList.add("is-message-visible");
        await typeBootMessage();
        if (bootCancelled) return;
        mlcTerminalBoot.classList.add("is-ready");
    };

    function checkTerminalBootPosition() {
        if (bootStarted) {
            return;
        }

        const bootBounds = mlcTerminalBoot.getBoundingClientRect();
        const viewportHeight = window.innerHeight;
        const isFillingViewport = bootBounds.top <= viewportHeight * 0.08 && bootBounds.bottom >= viewportHeight * 0.88;

        if (isFillingViewport) {
            runTerminalBoot();
        }
    }

    bootContinue?.addEventListener("click", exitTerminalBoot);
    bootClose?.addEventListener("click", cancelTerminalBoot);
    window.addEventListener("scroll", checkTerminalBootPosition, { passive: true });
    window.addEventListener("resize", checkTerminalBootPosition);
    window.requestAnimationFrame(checkTerminalBootPosition);
}

if (mlcTerminal && !reducedMotionQuery.matches && "IntersectionObserver" in window) {
    const terminalEntries = Array.from(mlcTerminal.querySelectorAll("[data-terminal-entry]"));
    document.documentElement.classList.add("terminal-enhanced");

    const waitForTyping = (duration) => new Promise((resolve) => {
        window.setTimeout(resolve, duration);
    });

    const captureTerminalText = (element) => {
        const walker = document.createTreeWalker(element, NodeFilter.SHOW_TEXT, {
            acceptNode: (node) => node.nodeValue.trim() ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        });
        const nodes = [];

        while (walker.nextNode()) {
            nodes.push({
                node: walker.currentNode,
                text: walker.currentNode.nodeValue
            });
        }

        nodes.forEach(({ node }) => {
            node.nodeValue = "";
        });

        return nodes;
    };

    const typeTerminalText = async (element, capturedNodes, delay, chunkSize) => {
        const cursor = document.createElement("span");
        cursor.className = "mlc-terminal__cursor";
        cursor.textContent = "_";
        cursor.setAttribute("aria-hidden", "true");
        element.classList.add("is-typing");

        for (const { node, text } of capturedNodes) {
            node.parentNode.insertBefore(cursor, node.nextSibling);

            for (let index = chunkSize; index < text.length + chunkSize; index += chunkSize) {
                node.nodeValue = text.slice(0, index);
                await waitForTyping(delay);
            }
        }

        cursor.remove();
        element.classList.remove("is-typing");
    };

    const startTerminalEntry = async (entry) => {
        if (entry.dataset.terminalStarted === "true") {
            return;
        }

        entry.dataset.terminalStarted = "true";
        entry.style.minHeight = `${Math.ceil(entry.getBoundingClientRect().height)}px`;
        entry.setAttribute("aria-busy", "true");

        const prompt = entry.querySelector("[data-terminal-prompt]");
        const response = entry.querySelector("[data-terminal-response]");
        const promptText = captureTerminalText(prompt);
        const responseText = captureTerminalText(response);

        entry.classList.add("is-started");
        await typeTerminalText(prompt, promptText, 24, 1);
        await waitForTyping(180);
        await typeTerminalText(response, responseText, 7, 4);

        entry.classList.add("is-complete");
        entry.setAttribute("aria-busy", "false");
    };

    const terminalObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (!entry.isIntersecting) {
                return;
            }

            terminalObserver.unobserve(entry.target);
            startTerminalEntry(entry.target);
        });
    }, {
        threshold: 0.08,
        rootMargin: "0px 0px -16% 0px"
    });

    const observeTerminalEntries = () => {
        terminalEntries.forEach((entry) => terminalObserver.observe(entry));
    };

    if (mlcTerminalBoot && !mlcTerminal.classList.contains("is-boot-complete")) {
        mlcTerminal.addEventListener("mlc-terminal-boot-complete", observeTerminalEntries, { once: true });
    } else {
        observeTerminalEntries();
    }
}

const terminalMediaButtons = Array.from(document.querySelectorAll("[data-terminal-gallery-index]"));

if (mlcTerminal && terminalMediaButtons.length) {
    const getTerminalMediaHitBounds = (button) => {
        const bounds = button.getBoundingClientRect();
        const viewportWidth = Math.max(1, window.innerWidth);
        const viewportHeight = Math.max(1, window.innerHeight);
        const points = [
            [bounds.left, bounds.top],
            [bounds.right, bounds.top],
            [bounds.right, bounds.bottom],
            [bounds.left, bounds.bottom]
        ];
        const displacedPoints = [];

        points.forEach(([x, y]) => {
            const normalizedX = Math.max(-1, Math.min(1, (x / viewportWidth) * 2 - 1));
            const normalizedY = Math.max(-1, Math.min(1, (y / viewportHeight) * 2 - 1));
            const radiusSquared = Math.min(1, (normalizedX ** 2 + normalizedY ** 2) / 2);
            const curve = radiusSquared * (0.65 + radiusSquared * 0.35);
            const shiftX = 124 * normalizedX * curve * 0.49;
            const shiftY = 124 * normalizedY * curve * 0.45;

            displacedPoints.push([x, y], [x + shiftX, y + shiftY], [x - shiftX, y - shiftY]);
        });

        return {
            left: Math.min(...displacedPoints.map(([x]) => x)) - 4,
            right: Math.max(...displacedPoints.map(([x]) => x)) + 4,
            top: Math.min(...displacedPoints.map(([, y]) => y)) - 4,
            bottom: Math.max(...displacedPoints.map(([, y]) => y)) + 4
        };
    };

    const isPointInsideTerminalMedia = (button, clientX, clientY) => {
        const bounds = getTerminalMediaHitBounds(button);
        return clientX >= bounds.left && clientX <= bounds.right && clientY >= bounds.top && clientY <= bounds.bottom;
    };

    document.addEventListener("pointermove", (event) => {
        const lightboxIsOpen = document.body.classList.contains("project-lightbox-open");

        terminalMediaButtons.forEach((button) => {
            button.classList.toggle("is-hover-proxy", !lightboxIsOpen && isPointInsideTerminalMedia(button, event.clientX, event.clientY));
        });
    }, { passive: true });

    document.addEventListener("click", (event) => {
        if (document.body.classList.contains("project-lightbox-open") || event.target.closest("[data-terminal-gallery-index], a, button, input, select, textarea")) {
            return;
        }

        const matchingButton = terminalMediaButtons.find((button) => isPointInsideTerminalMedia(button, event.clientX, event.clientY));

        if (matchingButton) {
            event.preventDefault();
            matchingButton.click();
        }
    });
}

if (mlcTerminal && !reducedMotionQuery.matches) {
    const svgNamespace = "http://www.w3.org/2000/svg";
    const xlinkNamespace = "http://www.w3.org/1999/xlink";
    const warpedEntries = Array.from(mlcTerminal.querySelectorAll("[data-terminal-warp], [data-terminal-entry]"));
    const filterSvg = document.createElementNS(svgNamespace, "svg");
    const filterDefinitions = document.createElementNS(svgNamespace, "defs");
    const filterRecords = [];
    let crtFrame = 0;
    let crtMapUrl = "";
    let crtDisposed = false;

    filterSvg.classList.add("mlc-crt-filter-definitions");
    filterSvg.setAttribute("width", "0");
    filterSvg.setAttribute("height", "0");
    filterSvg.setAttribute("aria-hidden", "true");
    filterSvg.appendChild(filterDefinitions);
    document.body.appendChild(filterSvg);

    const createFilterElement = (name, attributes = {}) => {
        const element = document.createElementNS(svgNamespace, name);

        Object.entries(attributes).forEach(([attribute, value]) => {
            element.setAttribute(attribute, String(value));
        });

        return element;
    };

    warpedEntries.forEach((entry, index) => {
        const filterId = `mlc-crt-viewport-warp-${index}`;
        const filter = createFilterElement("filter", {
            id: filterId,
            filterUnits: "userSpaceOnUse",
            primitiveUnits: "userSpaceOnUse",
            "color-interpolation-filters": "sRGB"
        });
        const neutralMap = createFilterElement("feFlood", {
            "flood-color": "rgb(128, 128, 128)",
            "flood-opacity": "1",
            result: "neutralMap"
        });
        const viewportMap = createFilterElement("feImage", {
            preserveAspectRatio: "none",
            result: "viewportMap"
        });
        const combinedMap = createFilterElement("feBlend", {
            in: "viewportMap",
            in2: "neutralMap",
            mode: "normal",
            result: "combinedMap"
        });
        const displacement = createFilterElement("feDisplacementMap", {
            in: "SourceGraphic",
            in2: "combinedMap",
            scale: "124",
            xChannelSelector: "R",
            yChannelSelector: "G"
        });

        filter.append(neutralMap, viewportMap, combinedMap, displacement);
        filterDefinitions.appendChild(filter);

        filterRecords.push({
            entry,
            filter,
            neutralMap,
            viewportMap,
            filterValue: `url("#${filterId}")`,
            isActive: false
        });
    });

    const createCrtDisplacementMap = () => {
        const mapCanvas = document.createElement("canvas");
        const mapWidth = Math.min(560, Math.max(220, Math.round(window.innerWidth / 3)));
        const mapHeight = Math.min(420, Math.max(180, Math.round(window.innerHeight / 3)));
        const mapContext = mapCanvas.getContext("2d", { alpha: false });

        if (!mapContext) {
            return "";
        }

        mapCanvas.width = mapWidth;
        mapCanvas.height = mapHeight;

        const mapImage = mapContext.createImageData(mapWidth, mapHeight);
        const pixels = mapImage.data;

        for (let y = 0; y < mapHeight; y += 1) {
            const normalizedY = (y / Math.max(1, mapHeight - 1)) * 2 - 1;

            for (let x = 0; x < mapWidth; x += 1) {
                const normalizedX = (x / Math.max(1, mapWidth - 1)) * 2 - 1;
                const radiusSquared = Math.min(1, (normalizedX ** 2 + normalizedY ** 2) / 2);
                const curve = radiusSquared * (0.65 + radiusSquared * 0.35);
                const pixelIndex = (y * mapWidth + x) * 4;
                const red = 0.5 + normalizedX * curve * 0.49;
                const green = 0.5 + normalizedY * curve * 0.45;

                pixels[pixelIndex] = Math.round(Math.max(0, Math.min(1, red)) * 255);
                pixels[pixelIndex + 1] = Math.round(Math.max(0, Math.min(1, green)) * 255);
                pixels[pixelIndex + 2] = 128;
                pixels[pixelIndex + 3] = 255;
            }
        }

        mapContext.putImageData(mapImage, 0, 0);
        return mapCanvas.toDataURL("image/png");
    };

    const updateCrtFilters = () => {
        crtFrame = 0;

        if (crtDisposed) {
            return;
        }

        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const filterPadding = 72;

        filterRecords.forEach((record) => {
            const bounds = record.entry.getBoundingClientRect();
            const isNearViewport = bounds.bottom > -viewportHeight && bounds.top < viewportHeight * 2;

            if (record.isActive !== isNearViewport) {
                record.isActive = isNearViewport;
                record.entry.classList.toggle("has-crt-warp", isNearViewport);
                record.entry.style.filter = isNearViewport ? record.filterValue : "none";
            }

            if (!isNearViewport) {
                return;
            }

            const localWidth = Math.ceil(record.entry.offsetWidth);
            const localHeight = Math.ceil(record.entry.offsetHeight);
            const filterX = -filterPadding;
            const filterY = -filterPadding;
            const filterWidth = localWidth + filterPadding * 2;
            const filterHeight = localHeight + filterPadding * 2;

            record.filter.setAttribute("x", String(filterX));
            record.filter.setAttribute("y", String(filterY));
            record.filter.setAttribute("width", String(filterWidth));
            record.filter.setAttribute("height", String(filterHeight));
            record.neutralMap.setAttribute("x", String(filterX));
            record.neutralMap.setAttribute("y", String(filterY));
            record.neutralMap.setAttribute("width", String(filterWidth));
            record.neutralMap.setAttribute("height", String(filterHeight));
            record.viewportMap.setAttribute("x", String(-bounds.left));
            record.viewportMap.setAttribute("y", String(-bounds.top));
            record.viewportMap.setAttribute("width", String(viewportWidth));
            record.viewportMap.setAttribute("height", String(viewportHeight));

        });
    };

    const scheduleCrtUpdate = () => {
        if (!crtFrame && !crtDisposed) {
            crtFrame = window.requestAnimationFrame(updateCrtFilters);
        }
    };

    const refreshCrtMap = () => {
        crtMapUrl = createCrtDisplacementMap();

        filterRecords.forEach(({ viewportMap }) => {
            viewportMap.setAttribute("href", crtMapUrl);
            viewportMap.setAttributeNS(xlinkNamespace, "xlink:href", crtMapUrl);
        });

        scheduleCrtUpdate();
    };

    const disposeCrtWarp = () => {
        if (crtDisposed) {
            return;
        }

        crtDisposed = true;

        if (crtFrame) {
            window.cancelAnimationFrame(crtFrame);
            crtFrame = 0;
        }

        window.removeEventListener("scroll", scheduleCrtUpdate);
        window.removeEventListener("resize", refreshCrtMap);
        window.removeEventListener("mlc-terminal-layoutchange", scheduleCrtUpdate);
        filterRecords.forEach(({ entry }) => {
            entry.classList.remove("has-crt-warp");
            entry.style.removeProperty("filter");
        });
        filterSvg.remove();
    };

    window.addEventListener("scroll", scheduleCrtUpdate, { passive: true });
    window.addEventListener("resize", refreshCrtMap);
    window.addEventListener("mlc-terminal-layoutchange", scheduleCrtUpdate);
    reducedMotionQuery.addEventListener("change", (event) => {
        if (event.matches) {
            disposeCrtWarp();
        }
    }, { once: true });

    refreshCrtMap();
}

//Credits

const projectCredits = document.querySelector(".project-credits");

if (projectCredits) {
    const revealProjectCredits = () => {
        projectCredits.classList.add("is-revealed");
    };

    if (reducedMotionQuery.matches || !("IntersectionObserver" in window)) {
        revealProjectCredits();
    } else {
        const creditsRevealObserver = new IntersectionObserver((entries) => {
            const entry = entries[0];

            if (!entry) {
                return;
            }

            if (entry.isIntersecting) {
                revealProjectCredits();
            } else if (entry.boundingClientRect.top > 0) {
                projectCredits.classList.remove("is-revealed");
            }
        }, {
            threshold: 0.08,
            rootMargin: "0px 0px -24% 0px"
        });

        creditsRevealObserver.observe(projectCredits);
    }

    const checkerCanvas = projectCredits.querySelector("[data-credits-checker]");
    const checkerContext = checkerCanvas?.getContext("2d");
    const checkerImage = new Image();
    const checkerPatternCanvas = document.createElement("canvas");
    const checkerPatternContext = checkerPatternCanvas.getContext("2d");
    const checkerMaskCanvas = document.createElement("canvas");
    const checkerMaskContext = checkerMaskCanvas.getContext("2d");
    const checkerTileSize = 88;
    let checkerFrame = 0;
    let checkerVisible = !("IntersectionObserver" in window);
    let checkerWidth = 0;
    let checkerHeight = 0;

    const resizeCreditsChecker = () => {
        if (!checkerCanvas || !checkerContext) {
            return;
        }

        const nextWidth = Math.max(1, projectCredits.clientWidth);
        const nextHeight = Math.max(1, projectCredits.clientHeight);
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);

        if (nextWidth === checkerWidth && nextHeight === checkerHeight) {
            return;
        }

        checkerWidth = nextWidth;
        checkerHeight = nextHeight;
        checkerCanvas.width = Math.ceil(nextWidth * pixelRatio);
        checkerCanvas.height = Math.ceil(nextHeight * pixelRatio);
        checkerCanvas.style.width = `${nextWidth}px`;
        checkerCanvas.style.height = `${nextHeight}px`;
        checkerPatternCanvas.width = Math.ceil(nextWidth);
        checkerPatternCanvas.height = Math.ceil(nextHeight);
        checkerMaskCanvas.width = Math.ceil(nextWidth);
        checkerMaskCanvas.height = Math.ceil(nextHeight);
        checkerContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    };

    const drawCreditsChecker = (timestamp = 0) => {
        checkerFrame = 0;

        if (!checkerCanvas || !checkerContext || !checkerPatternContext || !checkerImage.complete || !checkerImage.naturalWidth || !checkerVisible) {
            return;
        }

        resizeCreditsChecker();
        checkerContext.clearRect(0, 0, checkerWidth, checkerHeight);
        checkerPatternContext.clearRect(0, 0, checkerWidth, checkerHeight);

        const motionTime = reducedMotionQuery.matches ? 0 : timestamp;
        const pulseProgress = (Math.cos((motionTime / 3000) * Math.PI * 2) + 1) / 2;
        const checkerScale = reducedMotionQuery.matches ? 1 : 0.78 + pulseProgress * 0.22;
        const checkerCellSize = checkerTileSize / 2;
        const checkerCellInset = checkerCellSize * (1 - checkerScale) / 2;
        const sourceCellWidth = checkerImage.naturalWidth / 2;
        const sourceCellHeight = checkerImage.naturalHeight / 2;
        const checkerDrift = reducedMotionQuery.matches ? 0 : (motionTime / 12000 * checkerTileSize) % checkerTileSize;
        const parallaxOffset = reducedMotionQuery.matches ? 0 : (window.scrollY * 0.5) % checkerTileSize;
        const checkerVerticalOffset = (parallaxOffset + checkerDrift) % checkerTileSize;

        for (let y = -checkerTileSize + checkerVerticalOffset; y < checkerHeight + checkerTileSize; y += checkerTileSize) {
            for (let x = -checkerTileSize + checkerDrift; x < checkerWidth + checkerTileSize; x += checkerTileSize) {
                checkerPatternContext.drawImage(checkerImage, sourceCellWidth, 0, sourceCellWidth, sourceCellHeight, x + checkerCellSize + checkerCellInset, y + checkerCellInset, checkerCellSize * checkerScale, checkerCellSize * checkerScale);
                checkerPatternContext.drawImage(checkerImage, 0, sourceCellHeight, sourceCellWidth, sourceCellHeight, x + checkerCellInset, y + checkerCellSize + checkerCellInset, checkerCellSize * checkerScale, checkerCellSize * checkerScale);
            }
        }

        checkerPatternContext.globalCompositeOperation = "source-in";
        const creditsAccentRgb = getComputedStyle(projectCredits).getPropertyValue("--project-detail-accent-rgb").trim() || "255, 52, 79";
        const checkerGradient = checkerPatternContext.createLinearGradient(0, 0, checkerWidth, checkerHeight);
        checkerGradient.addColorStop(0, `rgba(${creditsAccentRgb}, 0.9)`);
        checkerGradient.addColorStop(0.52, "rgba(248, 233, 239, 0.7)");
        checkerGradient.addColorStop(1, `rgba(${creditsAccentRgb}, 0.72)`);
        checkerPatternContext.fillStyle = checkerGradient;
        checkerPatternContext.fillRect(0, 0, checkerWidth, checkerHeight);
        checkerPatternContext.globalCompositeOperation = "source-over";

        checkerContext.drawImage(checkerPatternCanvas, 0, 0, checkerWidth, checkerHeight);

        const creditsBounds = projectCredits.getBoundingClientRect();
        projectCredits.querySelectorAll(".project-credit__plane").forEach((panel) => {
            const panelBounds = panel.getBoundingClientRect();
            const panelX = panelBounds.left - creditsBounds.left;
            const panelY = panelBounds.top - creditsBounds.top;
            const panelBevel = Math.min(22, panelBounds.width * 0.05, panelBounds.height * 0.22);

            checkerContext.save();
            checkerContext.beginPath();
            checkerContext.moveTo(panelX + panelBevel, panelY);
            checkerContext.lineTo(panelX + panelBounds.width - panelBevel, panelY);
            checkerContext.lineTo(panelX + panelBounds.width, panelY + panelBevel);
            checkerContext.lineTo(panelX + panelBounds.width, panelY + panelBounds.height - panelBevel);
            checkerContext.lineTo(panelX + panelBounds.width - panelBevel, panelY + panelBounds.height);
            checkerContext.lineTo(panelX + panelBevel, panelY + panelBounds.height);
            checkerContext.lineTo(panelX, panelY + panelBounds.height - panelBevel);
            checkerContext.lineTo(panelX, panelY + panelBevel);
            checkerContext.closePath();
            checkerContext.clip();
            checkerContext.clearRect(panelX, panelY, panelBounds.width, panelBounds.height);
            checkerContext.filter = "blur(14px)";
            checkerContext.drawImage(checkerPatternCanvas, 0, 0, checkerWidth, checkerHeight);
            checkerContext.filter = "none";
            checkerContext.restore();
        });

        if (checkerMaskContext) {
            checkerMaskContext.clearRect(0, 0, checkerWidth, checkerHeight);
            const glowTargets = [
                projectCredits.querySelector(".project-credits__heading"),
                ...projectCredits.querySelectorAll(".project-credit")
            ].filter(Boolean);

            glowTargets.forEach((target, index) => {
                const targetBounds = target.getBoundingClientRect();
                const centerX = targetBounds.left - creditsBounds.left + targetBounds.width / 2;
                const centerY = targetBounds.top - creditsBounds.top + targetBounds.height / 2;
                const radiusX = Math.max(210, targetBounds.width * (index === 0 ? 0.78 : 0.82));
                const radiusY = Math.max(140, targetBounds.height * (index === 0 ? 1.8 : 2.8));

                checkerMaskContext.save();
                checkerMaskContext.translate(centerX, centerY);
                checkerMaskContext.scale(1, radiusY / radiusX);
                const glowMask = checkerMaskContext.createRadialGradient(0, 0, 0, 0, 0, radiusX);
                glowMask.addColorStop(0, "rgba(255, 255, 255, 1)");
                glowMask.addColorStop(0.5, "rgba(255, 255, 255, 0.78)");
                glowMask.addColorStop(1, "rgba(255, 255, 255, 0)");
                checkerMaskContext.fillStyle = glowMask;
                checkerMaskContext.fillRect(-radiusX, -radiusX, radiusX * 2, radiusX * 2);
                checkerMaskContext.restore();
            });

            checkerContext.globalCompositeOperation = "destination-in";
            checkerContext.drawImage(checkerMaskCanvas, 0, 0, checkerWidth, checkerHeight);
            checkerContext.globalCompositeOperation = "source-over";
        }

        if (!reducedMotionQuery.matches) {
            checkerFrame = window.requestAnimationFrame(drawCreditsChecker);
        }
    };

    const requestCreditsChecker = () => {
        if (!checkerFrame && checkerVisible) {
            checkerFrame = window.requestAnimationFrame(drawCreditsChecker);
        }
    };

    checkerImage.addEventListener("load", requestCreditsChecker);
    if (checkerCanvas?.dataset.checkerSource) {
        checkerImage.src = checkerCanvas.dataset.checkerSource;
    }

    if ("IntersectionObserver" in window) {
        const checkerObserver = new IntersectionObserver((entries) => {
            checkerVisible = entries[0]?.isIntersecting ?? false;

            if (checkerVisible) {
                requestCreditsChecker();
            } else if (checkerFrame) {
                window.cancelAnimationFrame(checkerFrame);
                checkerFrame = 0;
            }
        }, { rootMargin: "180px 0px" });
        checkerObserver.observe(projectCredits);
    }

    window.addEventListener("resize", requestCreditsChecker);
    reducedMotionQuery.addEventListener("change", requestCreditsChecker);

    const creditPanels = Array.from(projectCredits.querySelectorAll(".project-credit"));
    let creditTiltFrame = 0;
    let creditPointerY = 0;

    const resetCreditPanels = () => {
        creditPanels.forEach((credit) => {
            credit.classList.remove("is-tilting");
            credit.style.removeProperty("--credit-tilt-x");
            credit.style.removeProperty("--credit-panel-scale");
        });
    };

    const updateCreditPanels = () => {
        creditTiltFrame = 0;

        if (reducedMotionQuery.matches) {
            resetCreditPanels();
            return;
        }

        creditPanels.forEach((credit) => {
            const bounds = credit.getBoundingClientRect();
            const centerY = bounds.top + bounds.height / 2;
            const verticalDistance = creditPointerY - centerY;
            const verticalPosition = Math.max(-1, Math.min(1, verticalDistance / Math.max(180, bounds.height * 2.2)));
            const proximity = Math.max(0.34, 1 - Math.abs(verticalDistance) / 820);
            credit.classList.add("is-tilting");
            credit.style.setProperty("--credit-tilt-x", `${(-verticalPosition * 18 * proximity).toFixed(2)}deg`);
            credit.style.setProperty("--credit-panel-scale", `${(1 + proximity * 0.014).toFixed(4)}`);
        });
    };

    projectCredits.addEventListener("pointermove", (event) => {
        if (event.pointerType === "touch") {
            return;
        }

        creditPointerY = event.clientY;

        if (!creditTiltFrame) {
            creditTiltFrame = window.requestAnimationFrame(updateCreditPanels);
        }
    });
    projectCredits.addEventListener("pointerleave", resetCreditPanels);

    reducedMotionQuery.addEventListener("change", () => {
        if (!reducedMotionQuery.matches) {
            return;
        }

        resetCreditPanels();
    });
}

document.querySelectorAll("[data-project-gallery]").forEach((gallery) => {
    const slides = Array.from(gallery.querySelectorAll(".project-gallery__slide"));
    const previousButton = gallery.querySelector("[data-gallery-previous]");
    const nextButton = gallery.querySelector("[data-gallery-next]");
    const zoomButton = gallery.querySelector("[data-gallery-zoom]");
    const dotButtons = Array.from(gallery.querySelectorAll("[data-gallery-index]"));
    const externalZoomButtons = gallery.hasAttribute("data-terminal-gallery-source") ? Array.from(document.querySelectorAll("[data-terminal-gallery-index]")) : [];
    const lightbox = document.querySelector("[data-project-lightbox]");
    const lightboxImage = lightbox?.querySelector("[data-lightbox-image]");
    let lightboxOutgoingImage = lightbox?.querySelector("[data-lightbox-outgoing]");
    const lightboxVideo = lightbox?.querySelector("[data-lightbox-video]");
    const lightboxFigure = lightbox?.querySelector(".project-lightbox__figure");
    const lightboxClose = lightbox?.querySelector("[data-lightbox-close]");
    const lightboxPrevious = lightbox?.querySelector("[data-lightbox-previous]");
    const lightboxNext = lightbox?.querySelector("[data-lightbox-next]");
    let activeSlide = Math.max(0, slides.findIndex((slide) => slide.classList.contains("is-active")));
    let lightboxOpen = false;
    let lightboxReturnFocus = null;

    const isVideoSlide = (slide) => slide?.hasAttribute("data-gallery-video");
    const isZoomableSlide = (slide) => slide instanceof HTMLImageElement || isVideoSlide(slide);

    const applyLightboxMedia = () => {
        const currentSlide = slides[activeSlide];

        if (!isZoomableSlide(currentSlide) || !lightboxImage) {
            return false;
        }

        if (isVideoSlide(currentSlide)) {
            if (!lightboxVideo) {
                return false;
            }

            lightboxImage.hidden = true;
            lightboxVideo.hidden = false;
            lightboxVideo.title = currentSlide.dataset.videoTitle || "Project trailer";
            lightboxVideo.src = currentSlide.dataset.videoEmbed || "";
            lightboxFigure?.classList.add("is-video");
            return true;
        }

        if (lightboxVideo) {
            lightboxVideo.src = "";
            lightboxVideo.hidden = true;
        }

        lightboxFigure?.classList.remove("is-video");
        lightboxImage.hidden = false;
        lightboxImage.src = currentSlide.src;
        lightboxImage.alt = currentSlide.alt;
        return true;
    };

    const syncLightboxMedia = (direction = 0) => {
        if (!lightboxFigure || !lightboxOpen) {
            return;
        }

        if (!direction || reducedMotionQuery.matches) {
            lightboxFigure?.classList.remove("is-sliding-next", "is-sliding-previous");
            lightboxOutgoingImage?.remove();
            lightboxOutgoingImage = null;
            applyLightboxMedia();
            return;
        }

        const directionName = direction > 0 ? "next" : "previous";
        const slideClass = `is-sliding-${directionName}`;

        lightboxOutgoingImage?.remove();
        const outgoingMedia = lightboxVideo && !lightboxVideo.hidden ? lightboxVideo : lightboxImage;
        lightboxOutgoingImage = outgoingMedia.cloneNode(true);
        lightboxOutgoingImage.removeAttribute("data-lightbox-image");
        lightboxOutgoingImage.removeAttribute("data-lightbox-video");
        lightboxOutgoingImage.removeAttribute("data-lightbox-outgoing");
        lightboxOutgoingImage.removeAttribute("hidden");
        lightboxOutgoingImage.classList.add("project-lightbox__outgoing");
        lightboxOutgoingImage.setAttribute("aria-hidden", "true");
        lightboxOutgoingImage.setAttribute("tabindex", "-1");
        lightboxFigure.append(lightboxOutgoingImage);
        applyLightboxMedia();
        lightboxFigure.classList.remove("is-sliding-next", "is-sliding-previous");
        void lightboxFigure.offsetWidth;
        lightboxFigure.classList.add(slideClass);
    };

    lightboxFigure?.addEventListener("animationend", (event) => {
        if (event.target === lightboxImage || event.target === lightboxVideo) {
            lightboxFigure.classList.remove("is-sliding-next", "is-sliding-previous");
            lightboxOutgoingImage?.remove();
            lightboxOutgoingImage = null;
        }
    });

    const showSlide = (nextIndex, requestedDirection = 0) => {
        if (!slides.length) {
            return;
        }

        const previousSlide = activeSlide;
        activeSlide = (nextIndex + slides.length) % slides.length;
        const direction = requestedDirection || (activeSlide === previousSlide ? 0 : activeSlide > previousSlide ? 1 : -1);

        slides.forEach((slide, index) => {
            const isActive = index === activeSlide;
            slide.hidden = false;
            slide.classList.toggle("is-active", isActive);
            slide.setAttribute("aria-hidden", String(!isActive));

            if (!isActive && slide instanceof HTMLIFrameElement) {
                slide.contentWindow?.postMessage(JSON.stringify({
                    event: "command",
                    func: "pauseVideo",
                    args: []
                }), "*");
            }
        });

        const activeSlideIsZoomable = isZoomableSlide(slides[activeSlide]);
        gallery.classList.toggle("is-video-active", !activeSlideIsZoomable);

        if (zoomButton) {
            zoomButton.disabled = !activeSlideIsZoomable;
            zoomButton.setAttribute("aria-hidden", String(!activeSlideIsZoomable));
        }

        dotButtons.forEach((dotButton, index) => {
            const isActive = index === activeSlide;
            dotButton.classList.toggle("is-active", isActive);
            dotButton.setAttribute("aria-current", String(isActive));
        });

        syncLightboxMedia(direction);
    };

    const openLightbox = () => {
        if (!lightbox || !lightboxImage || !isZoomableSlide(slides[activeSlide])) {
            return;
        }

        lightboxReturnFocus = document.activeElement;
        lightboxOpen = true;
        syncLightboxMedia();
        lightbox.inert = false;
        lightbox.classList.add("is-open");
        lightbox.setAttribute("aria-hidden", "false");
        document.body.classList.add("project-lightbox-open");
        lightboxClose?.focus();
    };

    const closeLightbox = () => {
        if (!lightbox || !lightboxOpen) {
            return;
        }

        lightboxOpen = false;
        lightbox.inert = true;
        lightbox.classList.remove("is-open");
        lightbox.setAttribute("aria-hidden", "true");
        document.body.classList.remove("project-lightbox-open");

        if (lightboxVideo) {
            lightboxVideo.src = "";
            lightboxVideo.hidden = true;
        }

        lightboxOutgoingImage?.remove();
        lightboxOutgoingImage = null;

        if (lightboxReturnFocus instanceof HTMLElement) {
            lightboxReturnFocus.focus();
        }
    };

    previousButton?.addEventListener("click", () => showSlide(activeSlide - 1, -1));
    nextButton?.addEventListener("click", () => showSlide(activeSlide + 1, 1));
    zoomButton?.addEventListener("click", openLightbox);
    dotButtons.forEach((dotButton) => {
        dotButton.addEventListener("click", () => {
            const targetIndex = Number(dotButton.dataset.galleryIndex);
            showSlide(targetIndex, targetIndex === activeSlide ? 0 : targetIndex > activeSlide ? 1 : -1);
        });
    });
    externalZoomButtons.forEach((externalButton) => {
        externalButton.addEventListener("click", () => {
            const targetIndex = Number(externalButton.dataset.terminalGalleryIndex);

            if (!Number.isInteger(targetIndex) || targetIndex < 0 || targetIndex >= slides.length) {
                return;
            }

            const direction = targetIndex === activeSlide ? 0 : targetIndex > activeSlide ? 1 : -1;
            showSlide(targetIndex, direction);
            openLightbox();
        });
    });
    lightboxClose?.addEventListener("click", closeLightbox);
    lightboxPrevious?.addEventListener("click", () => showSlide(activeSlide - 1, -1));
    lightboxNext?.addEventListener("click", () => showSlide(activeSlide + 1, 1));
    lightbox?.addEventListener("click", (event) => {
        if (event.target === lightbox) {
            closeLightbox();
        }
    });
    document.addEventListener("keydown", (event) => {
        if (!lightboxOpen) {
            return;
        }

        if (event.key === "Escape") {
            closeLightbox();
        } else if (event.key === "ArrowLeft") {
            showSlide(activeSlide - 1, -1);
        } else if (event.key === "ArrowRight") {
            showSlide(activeSlide + 1, 1);
        }
    });
    showSlide(activeSlide);
});
