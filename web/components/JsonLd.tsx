/**
 * Emits a JSON-LD structured-data block.
 *
 * `<` is escaped because a `</script>` sequence appearing inside any string in
 * the data (a case study title, say) would otherwise close the tag early and
 * spill the rest of the JSON into the document as markup.
 */
export function JsonLd({data}: {data: Record<string, unknown>}) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, '\\u003c'),
      }}
    />
  )
}
