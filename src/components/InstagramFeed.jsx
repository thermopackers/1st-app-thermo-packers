import { useEffect, useState } from "react";
import axiosInstance from "../axiosInstance";

const InstagramFeed = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    axiosInstance.get("/posts").then(res => setPosts(res.data));
  }, []);

  return (
    <section className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 p-4">
      {posts.map((post) => (
        <a key={post.id} href={post.permalink} target="_blank" rel="noopener noreferrer">
          <img src={post.media_url} alt={post.caption} className="rounded-lg shadow-md hover:shadow-xl" />
        </a>
      ))}
    </section>
  );
};

export default InstagramFeed;
