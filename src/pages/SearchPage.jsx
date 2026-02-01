import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import apiService from "../services/api";
import PostCard from "../components/PostCard";
import LoadingSpinner from "../components/LoadingSpinner";

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("query") || "";

  const [searchInput, setSearchInput] = useState(query);
  const [posts, setPosts] = useState([]);
  const [businessNames, setBusinessNames] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setSearchInput(query);

    if (query.trim()) performSearch(query);
    else {
      setPosts([]);
      setBusinessNames([]);
    }
  }, [query]);

  const performSearch = async (q) => {
    setLoading(true);
    try {
      // apiService.searchPosts() hits GET /api/posts/search?query=... [file:315]
      const data = await apiService.searchPosts(q);

      // Support both possible backend shapes:
      // 1) PostDto[]  (old)
      // 2) { businessNames: string[], posts: PostDto[] } (new)
      const nextPosts = Array.isArray(data)
          ? data
          : Array.isArray(data?.posts)
              ? data.posts
              : [];

      const nextNames = Array.isArray(data?.businessNames)
          ? data.businessNames
          : [...new Set(nextPosts.map((p) => (p?.name || "").trim()).filter(Boolean))];

      setPosts(nextPosts);
      setBusinessNames(nextNames);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchInput.trim()) setSearchParams({ query: searchInput });
  };

  return (
      <div className="space-y-6">
        {/* keep your existing search form UI here, use handleSearch + searchInput */}

        {loading ? (
            <LoadingSpinner size="lg" text="Searching..." />
        ) : query ? (
            <div className="space-y-6">
              {/* Unique business entities (buttons) */}
              {businessNames.length > 0 && (
                  <div className="card p-4">
                    <div className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Business entities found
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {businessNames.map((name) => (
                          <Link
                              key={name}
                              to={`/fraud-profile/${encodeURIComponent(name)}`} // route exists [file:317]
                              className="btn btn-secondary"
                              title="Open Fraud Profile"
                          >
                            {name}
                          </Link>
                      ))}
                    </div>
                  </div>
              )}

              {/* Posts list */}
              <div className="flex flex-col gap-3">
                {posts.map((post) => (
                    <PostCard key={post.id} post={post} />
                ))}

                {posts.length === 0 && (
                    <div className="card p-12 text-center">No Results Found</div>
                )}
              </div>
            </div>
        ) : (
            <div className="card p-12 text-center">Search for Fraud Reports</div>
        )}
      </div>
  );
}
