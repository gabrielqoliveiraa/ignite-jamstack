import { GetStaticProps } from 'next';
import { useState } from 'react';
import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';
import Link from 'next/link';

import { FiUser } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
import { format } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';

import { getPrismicClient } from '../services/prismic';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const formatedPosts = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        { locale: ptBR }
      ),
    };
  });

  const [posts, setPosts] = useState<Post[]>(formatedPosts);
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );
    setNextPage(postResults.nextPage);
    setCurrentPage(postResults.page);

    const newPosts = postResults.results.map(post => {
      return {
        uid: post.uid,
        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          { locale: ptBR }
        ),
        data: {
          title: RichText.asText(post.data.title),
          subtitle: RichText.asText(post.data.subtitle),
          author: RichText.asText(post.data.author),
        },
      };
    });
    setPosts([...posts, newPosts]);
  }

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Header />

        {posts.map(post => (
          <section key={post.uid}>
            <Link href={`/post/${post.uid}`}>
              <h2>{post.data.title}</h2>
            </Link>

            <p>{post.data.subtitle}</p>
            <footer>
              <span>
                <FiCalendar /> {post.first_publication_date}
              </span>
              <span>
                <FiUser /> {post.data.author}
              </span>
            </footer>
          </section>
        ))}

        {postsPagination.next_page ? (
          <button onClick={handleNextPage} type="button">
            Carregar mais Posts
          </button>
        ) : (
          ''
        )}
      </div>
    </div>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();
  const postsResponse = await prismic.query(
    [Prismic.predicates.at('document.type', 'posts')],
    {
      fetch: ['posts.title', 'posts.subtitle', 'posts.author'],
      pageSize: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts = postsResponse.results.map(post => {
    return {
      uid: post.uid,
      first_publication_date: post.first_publication_date,
      data: {
        title: RichText.asText(post.data.title),
        subtitle: RichText.asText(post.data.subtitle),
        author: RichText.asText(post.data.author),
      },
    };
  });

  return {
    props: {
      postsPagination: {
        next_page: nextPage,
        results: posts,
      },
    },
  };
};
