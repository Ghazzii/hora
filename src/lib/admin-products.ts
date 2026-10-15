/** Confirmation text shown before an admin permanently deletes a product. */
export function deleteQuestion(name: string, orderLines: number) {
  return `Delete “${name}” permanently? This removes its options, photos list, reviews and stock history.${orderLines ? ` It appears in ${orderLines} past order line(s); those orders keep their own copy of the name, price and photo.` : ""} To only take it off the store, use “Hidden” instead.`;
}
