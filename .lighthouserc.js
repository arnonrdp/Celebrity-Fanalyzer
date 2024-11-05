module.exports = {
  ci: {
    collect: {
      staticDistDir: './dist',
      url: ['http://localhost:9200']
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.7 }],
        'categories:accessibility': ['error', { minScore: 0.8 }],
        'categories:best-practices': ['error', { minScore: 0.8 }],
        'categories:seo': ['error', { minScore: 0.8 }]
      }
    }
  }
}
