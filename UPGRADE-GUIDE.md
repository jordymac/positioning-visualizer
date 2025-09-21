# RAG Upgrade Guide

Your positioning tool has been upgraded from GraphRAG to SimpleRAG with Supabase vector search and enhanced controls.

## 🚀 Setup Instructions

### 1. Supabase Setup

1. **Create a Supabase project** at https://supabase.com
2. **Run the database setup**:
   - Go to your Supabase dashboard → SQL Editor
   - Run the script in `supabase-setup.sql`
   - This creates the vector tables and search functions

### 2. Environment Variables

Add these to your `.env` file:

```env
# Existing variables
VITE_API_URL=http://localhost:3001
OPENAI_API_KEY=your_openai_api_key_here

# New Supabase variables
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Migrate Your Examples

Run the migration script to populate your vector database:

```bash
# Make sure your environment variables are set first
npm run migrate-examples
```

Or run manually:
```bash
npx tsx src/scripts/migrateToVector.ts
```

## 🎯 What's New

### Enhanced RAG System
- **Vector Search**: Uses Supabase pgvector for semantic similarity
- **Smart Caching**: Reduces API costs with embedding and generation caching
- **Better Context**: More relevant examples based on vector similarity

### User Controls
- **Temperature**: Controls creativity (0 = conservative, 1 = creative)
- **Top-p**: Controls vocabulary diversity (0.3 = simple, 1.0 = rich)
- **Live Preview**: See parameter values as you adjust sliders

### Performance Improvements
- **Faster Queries**: Vector search is much faster than graph traversal
- **Cost Efficient**: Embedding caching prevents redundant API calls
- **Scalable**: Can handle thousands of examples efficiently

## 🔧 Architecture Changes

### Before (GraphRAG)
```
User Input → Graph Building → Graph Traversal → Generation → Output
```

### After (SimpleRAG)
```
User Input → Vector Search → Context Building → Generation → Output
                ↓
            Cache Check → If cached, return immediately
```

## 📊 Database Schema

### Key Tables
- `positioning_examples_v2`: Your examples with vector embeddings
- `embedding_cache`: Caches embeddings to reduce API costs
- `generation_cache`: Caches generated content for 7 days

### Vector Search Function
```sql
find_similar_examples(query_embedding, match_threshold, match_count)
```

## 🎛️ Generation Controls

### Temperature (0.0 - 1.0)
- **0.0-0.3**: Very conservative, corporate language
- **0.3-0.5**: Professional with some variation  
- **0.5-0.7**: Balanced creativity
- **0.7-1.0**: Creative and varied

### Top-p (0.3 - 1.0)
- **0.3-0.5**: Simple, direct vocabulary
- **0.5-0.7**: Professional variety
- **0.7-0.9**: Rich vocabulary
- **0.9-1.0**: Highly varied expressions

## 🧪 Testing

1. **Test Vector Search**:
   ```bash
   npx tsx src/scripts/migrateToVector.ts
   ```

2. **Test Generation with Controls**:
   - Use the new sliders in the form
   - Try different temperature/top-p combinations
   - Check console for cache hits

3. **Verify Backend**:
   ```bash
   curl http://localhost:3001/health
   ```

## 🚨 Migration Notes

### From GraphRAG to SimpleRAG
- Your existing 7 examples will be migrated with embeddings
- Complex graph relationships are replaced with vector similarity
- Performance should be significantly better
- Caching will reduce OpenAI API costs

### Environment Changes
- Added Supabase configuration
- Backend now supports temperature/top-p parameters
- New embedding endpoint for vector generation

## 🔍 Monitoring

### Cache Performance
- Check console logs for "Using cached result"
- Monitor Supabase dashboard for query performance
- Watch OpenAI usage for cost optimization

### Vector Quality
- Similar examples should be semantically related
- Adjust match_threshold in SimpleRAG service if needed
- Monitor generation quality with different settings

## 📈 Next Steps

1. **Run migration script** to populate your vector database
2. **Test the new UI controls** for temperature/top-p
3. **Monitor caching performance** in production
4. **Experiment with settings** to find optimal parameters
5. **Consider adding more examples** to improve vector search quality

## 🆘 Troubleshooting

### Common Issues

**Vector search not working**:
- Check Supabase connection in browser console
- Verify pgvector extension is enabled
- Run the SQL setup script again

**Embeddings failing**:
- Check OpenAI API key in backend
- Monitor rate limits in server logs
- Verify embedding endpoint is accessible

**Poor generation quality**:
- Adjust temperature/top-p settings
- Check if relevant examples exist in database
- Verify prompt formatting in SimpleRAG service

**Cache not working**:
- Check Supabase table permissions
- Monitor cache table sizes in dashboard
- Verify cache key generation logic

The upgraded system should provide better performance, lower costs, and more user control over generation quality!