export function formatQdrantResults(rawResults) {
  let ids = []
  let scores = []
  let query_embeddings = []
  rawResults.map(item => {
    ids.push(item.id)
  })

  rawResults.map(item => {
    scores.push(item.score)
  })

  rawResults.map(item => {
    query_embeddings.push(item.vector)
  })

  return { 
    ids,
    scores,
    query_embedding: query_embeddings
  }
}