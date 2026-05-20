/**
 * Hydrates `detail_portfolio.html` from embedded JSON (written by scripts/merge-cms.mjs).
 */
(function () {
  function readPayload() {
    var el = document.getElementById("__cms_portfolio_detail");
    if (!el) return null;
    try {
      return JSON.parse(el.textContent);
    } catch (e) {
      console.error("[cms] portfolio detail JSON", e);
      return null;
    }
  }

  var root = readPayload();
  if (!root || !root.items) return;

  var params = new URLSearchParams(window.location.search);
  var slug = (params.get("slug") || "").trim();
  var row = root.items.find(function (r) {
    return r.slug === slug;
  });
  var cats = root.categories || {};

  if (!row) {
    var nf = document.querySelector("h1.heading-2.centered-heading");
    if (nf) nf.textContent = "Project not found";
    document.title = "Not found | Portfolio | Digitalist";
    return;
  }

  document.title = row.name + " | Portfolio | Digitalist";
  var meta = document.querySelector('meta[name="description"]');
  if (meta && row.postSummary) meta.setAttribute("content", row.postSummary);

  var h1 = document.querySelector("h1.heading-2.centered-heading");
  if (h1) h1.textContent = row.name;

  var authorImg = document.querySelector(".rl_blogpost1_author-wrapper img");
  if (authorImg) {
    if (row.clientLogo) {
      authorImg.src = row.clientLogo;
      authorImg.alt = row.clientName || "";
      authorImg.style.display = "";
    } else {
      authorImg.style.display = "none";
    }
  }

  var clientName = document.querySelector(".heading-5.portfolio-page");
  if (clientName) clientName.textContent = row.clientName || "";

  var industryP = document.querySelector(".rl_blogpost1_date-wrapper .paragraph");
  if (industryP) {
    industryP.textContent = row.clientIndustry || row.date || "";
  }

  var catList = document.querySelector(
    ".portfolio-category-wrapper.no-bg .collection-list-4.w-dyn-items",
  );
  if (catList) {
    var tpl = catList.querySelector(".portfolio-tags-2.w-dyn-item");
    catList.innerHTML = "";
    if (tpl && row.categorySlugs && row.categorySlugs.length) {
      row.categorySlugs.forEach(function (catSlug) {
        var node = tpl.cloneNode(true);
        var div = node.querySelector(".portfolio-tag-3");
        if (div) {
          div.textContent = cats[catSlug] || catSlug;
          div.classList.remove("w-dyn-bind-empty");
        }
        node.classList.remove("w-dyn-bind-empty");
        catList.appendChild(node);
      });
    }
  }

  var hero = document.querySelector(".rl_blogpost1_image-wrapper img.rl_blogpost1_image");
  if (hero && row.mainImage) {
    hero.src = row.mainImage;
    hero.alt = row.name || "";
    hero.classList.remove("w-dyn-bind-empty");
  }

  var richtext = document.querySelector(".rl_blogpost1_content .paragraph.w-richtext");
  if (richtext) {
    if (row.projectOverviewHtml) {
      richtext.innerHTML = row.projectOverviewHtml;
    }
    richtext.classList.remove("w-dyn-bind-empty");
  }

  var h3 = document.querySelector(".rl_blogpost1_content h3.heading-5");
  if (h3) {
    if (row.postSummary) {
      h3.textContent = row.postSummary;
      h3.classList.remove("w-dyn-bind-empty");
      h3.style.display = "";
    } else {
      h3.style.display = "none";
    }
  }

  var galList = document.querySelector(
    ".collection-list-wrapper-3 .collection-list-5.w-dyn-items",
  );
  if (galList) {
    var galTpl = galList.querySelector(".collection-item-5.w-dyn-item");
    galList.innerHTML = "";
    var urls =
      row.galleryUrls && row.galleryUrls.length
        ? row.galleryUrls
        : row.mainImage
          ? [row.mainImage]
          : [];
    if (galTpl && urls.length) {
      urls.forEach(function (url) {
        var node = galTpl.cloneNode(true);
        var img = node.querySelector("img.image-21");
        if (img) {
          img.src = url;
          img.alt = row.name || "";
          img.classList.remove("w-dyn-bind-empty");
        }
        node.classList.remove("w-dyn-bind-empty");
        galList.appendChild(node);
      });
    } else {
      var wrap = document.querySelector(".collection-list-wrapper-3.w-dyn-list");
      if (wrap) wrap.style.display = "none";
    }
  }

  document.querySelectorAll(".w-dyn-bind-empty").forEach(function (n) {
    n.classList.remove("w-dyn-bind-empty");
  });
})();
