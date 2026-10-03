// Shoutout codex because what does any of this mean

import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const token = process.env.PATREON_CREATOR_ACCESS_TOKEN;
const outputPath = resolve("newsletter/patreon-posts.json");
const patreonOrigin = "https://www.patreon.com";

if (!token) {
    throw new Error("PATREON_CREATOR_ACCESS_TOKEN is required");
}

async function patreonRequest(url) {
    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json"
        }
    });

    if (!response.ok) {
        throw new Error(`Patreon API request failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

function decodeEntities(value) {
    return String(value || "")
        .replace(/&nbsp;/gi, " ")
        .replace(/&amp;/gi, "&")
        .replace(/&quot;/gi, '"')
        .replace(/&#39;/gi, "'")
        .replace(/&lt;/gi, "<")
        .replace(/&gt;/gi, ">");
}

function excerptFromHtml(value) {
    const text = decodeEntities(
        String(value || "")
            .replace(/<br\s*\/?>/gi, " ")
            .replace(/<\/p>/gi, " ")
            .replace(/<[^>]+>/g, " ")
    ).replace(/\s+/g, " ").trim();

    if (text.length <= 190) {
        return text;
    }

    return `${text.slice(0, 187).trimEnd()}...`;
}

function normalizeUrl(value) {
    if (typeof value !== "string") {
        return null;
    }

    const normalized = decodeEntities(value)
        .replace(/\\u0026/gi, "&")
        .replace(/\\u003d/gi, "=")
        .replace(/\\\//g, "/")
        .trim();

    if (!normalized) {
        return null;
    }

    try {
        return new URL(normalized, patreonOrigin).href;
    } catch {
        return null;
    }
}

function firstUrl(...values) {
    for (const value of values.flat(Infinity)) {
        const url = normalizeUrl(value);
        if (url) {
            return url;
        }
    }

    return null;
}

function imageFromEmbedData(value) {
    if (!value || typeof value !== "object") {
        return null;
    }

    return firstUrl(
        value.image_url,
        value.thumbnail_url,
        value.thumbnail_large_url,
        value.thumbnail,
        value.image,
        value.image?.url
    );
}

function contentImage(value) {
    const html = String(value || "");
    const match = html.match(/<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/i);
    return match?.[1] ? normalizeUrl(match[1]) : null;
}

function mediaImage(resource) {
    const attributes = resource?.attributes || resource || {};
    const imageUrls = attributes.image_urls || {};

    return firstUrl(
        imageUrls.original,
        imageUrls.default,
        imageUrls.large,
        imageUrls.thumbnail_large,
        imageUrls.thumbnail,
        imageUrls.url,
        attributes.download_url
    );
}

function buildIncludedMap(included) {
    const map = new Map();

    for (const item of Array.isArray(included) ? included : []) {
        if (!item?.type || !item?.id) {
            continue;
        }

        map.set(`${item.type}:${item.id}`, item);
    }

    return map;
}

function relatedMediaImages(post, includedMap) {
    const relationships = post?.relationships || {};
    const relationshipNames = ["images", "media", "attachments_media", "attachments"];
    const images = [];

    for (const name of relationshipNames) {
        const relationshipData = relationships[name]?.data;
        const refs = Array.isArray(relationshipData)
            ? relationshipData
            : relationshipData
                ? [relationshipData]
                : [];

        for (const ref of refs) {
            const resource = includedMap.get(`${ref.type}:${ref.id}`);
            const image = mediaImage(resource);
            if (image) {
                images.push(image);
            }
        }
    }

    return images;
}

function internalPostImages(post, includedMap) {
    const attributes = post?.attributes || {};
    const image = attributes.image || {};
    const thumbnail = attributes.thumbnail || {};
    const relatedImages = relatedMediaImages(post, includedMap);

    const previewImage = firstUrl(
        attributes.thumbnail_url,
        thumbnail.large_url,
        thumbnail.url,
        image.large_url,
        image.url,
        image.original_url,
        relatedImages,
        contentImage(attributes.content)
    );

    const embedImage = firstUrl(
        attributes.meta_image_url,
        previewImage
    );

    return { previewImage, embedImage };
}

async function loadInternalPostImages(campaignId) {
    const byId = new Map();
    let url = new URL(`${patreonOrigin}/api/posts`);
    url.searchParams.set("include", "campaign,access_rules,attachments,attachments_media,audio,images,media,user");
    url.searchParams.set(
        "fields[post]",
        "content,current_user_can_view,embed,image,is_paid,meta_image_url,patreon_url,published_at,post_type,preview_asset_type,thumbnail,thumbnail_url,teaser_text,title,url"
    );
    url.searchParams.set("fields[media]", "id,image_urls,download_url,metadata,file_name");
    url.searchParams.set("filter[campaign_id]", campaignId);
    url.searchParams.set("filter[contains_exclusive_posts]", "true");
    url.searchParams.set("filter[is_draft]", "false");
    url.searchParams.set("sort", "-published_at");
    url.searchParams.set("json-api-version", "1.0");

    try {
        while (url) {
            const response = await fetch(url, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    Accept: "application/vnd.api+json",
                    "Content-Type": "application/vnd.api+json"
                },
                redirect: "follow"
            });

            if (!response.ok) {
                console.log(`Patreon internal post feed unavailable: ${response.status} ${response.statusText}`);
                return byId;
            }

            const payload = await response.json();
            const includedMap = buildIncludedMap(payload.included);

            for (const post of Array.isArray(payload.data) ? payload.data : []) {
                byId.set(String(post.id), internalPostImages(post, includedMap));
            }

            const next = normalizeUrl(payload.links?.next);
            url = next ? new URL(next) : null;
        }
    } catch (error) {
        console.log(`Could not read Patreon internal post feed: ${error.message}`);
    }

    return byId;
}

const campaignsUrl = new URL(`${patreonOrigin}/api/oauth2/v2/campaigns`);
campaignsUrl.searchParams.set("fields[campaign]", "vanity,url");
campaignsUrl.searchParams.set("page[count]", "100");
const campaignsPayload = await patreonRequest(campaignsUrl);
const campaigns = Array.isArray(campaignsPayload.data) ? campaignsPayload.data : [];
const campaign = campaigns.find((item) => item.attributes?.vanity?.toLowerCase() === "purgateam") || campaigns[0];

if (!campaign) {
    throw new Error("No Patreon campaign was found for this creator token");
}

const internalImages = await loadInternalPostImages(campaign.id);
const posts = [];
let cursor = null;

do {
    const postsUrl = new URL(`${patreonOrigin}/api/oauth2/v2/campaigns/${campaign.id}/posts`);
    postsUrl.searchParams.set("fields[post]", "content,embed_data,embed_url,is_public,published_at,title,url");
    postsUrl.searchParams.set("page[count]", "100");
    if (cursor) {
        postsUrl.searchParams.set("page[cursor]", cursor);
    }

    const payload = await patreonRequest(postsUrl);
    if (Array.isArray(payload.data)) {
        posts.push(...payload.data);
    }
    cursor = payload.meta?.pagination?.cursors?.next || null;
} while (cursor);

const newsletterPosts = posts
    .filter((post) => post.attributes?.published_at)
    .map((post) => {
        const attributes = post.attributes || {};
        const isPublic = attributes.is_public === true;
        const url = normalizeUrl(attributes.url) || `${patreonOrigin}/c/PurgaTeam/`;
        const internal = internalImages.get(String(post.id)) || {};
        const previewImage = internal.previewImage || imageFromEmbedData(attributes.embed_data);
        const embedImage = internal.embedImage || previewImage;

        console.log(
            `Patreon post ${post.id}: internal=${internalImages.has(String(post.id)) ? "yes" : "no"}, previewImage=${previewImage ? "yes" : "no"}, embedImage=${embedImage ? "yes" : "no"}`
        );

        return {
            id: post.id,
            title: attributes.title || "PurgaTeam Newsletter",
            publishedAt: attributes.published_at,
            url,
            excerpt: isPublic ? excerptFromHtml(attributes.content) : "Read the full newsletter on Patreon.",
            previewImage,
            embedImage,
            image: previewImage,
            isPublic
        };
    })
    .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));

await writeFile(outputPath, `${JSON.stringify({
    ready: true,
    updatedAt: new Date().toISOString(),
    posts: newsletterPosts
}, null, 2)}\n`);
