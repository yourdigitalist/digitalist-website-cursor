/**
 * POST contact form to Next.js /api/contact (Resend).
 */
(function () {
  var form = document.getElementById("wf-form-Start-Project-Form");
  if (!form || form.tagName !== "FORM") return;

  var wrap = form.closest(".combine-contact1_component") || form.parentElement;
  var success = document.getElementById("success-message");
  var fail = wrap ? wrap.querySelector(".combine-form_error-message.w-form-fail") : null;
  var submit = form.querySelector('input[type="submit"]');

  form.addEventListener(
    "submit",
    function (e) {
      e.preventDefault();

      var hp = form.querySelector('input[name="website"]');
      if (hp && hp.value && String(hp.value).trim() !== "") {
        return;
      }

      var firstEl = form.querySelector("#First-Name-2");
      var emailEl = form.querySelector("#Contact-Email-2");
      var msgEl = form.querySelector("#Contact-Message-2");
      var terms = form.querySelector("#Contact-1-Checkbox-2");

      var firstName = (firstEl && firstEl.value) || "";
      var email = (emailEl && emailEl.value) || "";
      var message = (msgEl && msgEl.value) || "";

      firstName = String(firstName).trim();
      email = String(email).trim();
      message = String(message).trim();

      if (success) success.style.display = "none";
      if (fail) fail.style.display = "none";

      if (submit) {
        submit.disabled = true;
        submit.value = submit.getAttribute("data-wait") || "Please wait...";
      }

      fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName,
          email: email,
          message: message,
          agreedToTerms: !!(terms && terms.checked),
          honeypot: hp ? String(hp.value || "") : "",
        }),
      })
        .then(function (res) {
          return res.text().then(function (text) {
            var data = {};
            if (text) {
              try {
                data = JSON.parse(text);
              } catch (ignore) {
                data = {};
              }
            }
            return { ok: res.ok, data: data };
          });
        })
        .then(function (out) {
          if (out.ok) {
            form.style.display = "none";
            if (success) success.style.display = "block";
          } else if (fail) {
            fail.style.display = "block";
            var tb = fail.querySelector(".text-block-4");
            if (tb && out.data && out.data.error) {
              tb.textContent = out.data.error;
            }
          }
        })
        .catch(function () {
          if (fail) fail.style.display = "block";
        })
        .finally(function () {
          if (submit) {
            submit.disabled = false;
            submit.value = "SEND";
          }
        });
    },
    true,
  );
})();
