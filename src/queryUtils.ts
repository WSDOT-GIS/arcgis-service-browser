const checkboxSelector = "input[type=checkbox]";

function setAllCheckboxesToIndeterminate(form: HTMLFormElement) {
  form
    .querySelectorAll<HTMLInputElement>(checkboxSelector)
    .forEach((cb) => (cb.indeterminate = true));
}

export function setupQueryForm(serverUrl: string) {
  console.debug(`${serverUrl} is a layer query URL`);
  const templateSelector = "template#queryFormTemplate";
  const template =
    document.body.querySelector<HTMLTemplateElement>(templateSelector);
  if (!template) {
    throw new TypeError(`Could not find "${templateSelector}"`);
  }
  // Clone the template content, which in this case is a <form>.
  const fragment = template.content.cloneNode(true);

  const forms = Array.from(fragment.childNodes).filter(
    (c) => c instanceof HTMLFormElement
  );

  const form = forms.length ? (forms[0] as HTMLFormElement) : null;

  if (!(form instanceof HTMLFormElement)) {
    throw new TypeError("Could not find form");
  }

  document.body.append(fragment);

  form.action = serverUrl;

  // Set all checkboxes to be indeterminate.
  setAllCheckboxesToIndeterminate(form);

  form.addEventListener("reset", function () {
    setAllCheckboxesToIndeterminate(this);
  });

  // form.addEventListener("submit", (e) => {
  //   // stop form from being submitted.
  //   e.preventDefault();
  // });
}
