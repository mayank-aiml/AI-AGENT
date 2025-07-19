// Simple text-based search fallback when embeddings are not available
export function performKeywordSearch(query: string, documents: any[]): any[] {
  const queryTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 2);
  
  const searchResults: { document: any, score: number, matchingChunks: string[] }[] = [];
  
  for (const doc of documents) {
    if (!doc.content) continue;
    
    const content = doc.content.toLowerCase();
    let score = 0;
    const matchingChunks: string[] = [];
    
    // Split content into chunks for better context
    const chunks = doc.content.split(/\n\n+/).filter((chunk: string) => chunk.trim().length > 50);
    
    for (const term of queryTerms) {
      // Count occurrences in content
      const matches = (content.match(new RegExp(term, 'g')) || []).length;
      score += matches;
      
      // Find chunks containing the term
      for (const chunk of chunks) {
        if (chunk.toLowerCase().includes(term) && !matchingChunks.includes(chunk)) {
          matchingChunks.push(chunk.trim());
        }
      }
    }
    
    if (score > 0) {
      searchResults.push({
        document: doc,
        score,
        matchingChunks: matchingChunks.slice(0, 3) // Limit to 3 most relevant chunks
      });
    }
  }
  
  // Sort by score and return top results
  return searchResults
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map(result => ({
      id: result.document.id,
      originalName: result.document.originalName,
      fileType: result.document.fileType,
      content: result.matchingChunks.join('\n\n'),
      relevanceScore: result.score
    }));
}