export function handleFormArrowNavigation(event) {
  if (!event.altKey) {
    return;
  }

  if (
    event.key !== "ArrowDown" &&
    event.key !== "ArrowUp"
  ) {
    return;
  }

  const container = event.currentTarget;

  const fields = Array.from(
    container.querySelectorAll(
      'input:not(:disabled), textarea:not(:disabled), select:not(:disabled)'
    )
  );

  const currentIndex = fields.indexOf(document.activeElement);

  if (currentIndex === -1) {
    return;
  }

  event.preventDefault();

  if (event.key === "ArrowDown") {
    const nextIndex =
      currentIndex === fields.length - 1
        ? 0
        : currentIndex + 1;

    fields[nextIndex]?.focus();
  }

  if (event.key === "ArrowUp") {
    const previousIndex =
      currentIndex === 0
        ? fields.length - 1
        : currentIndex - 1;

    fields[previousIndex]?.focus();
  }
}
