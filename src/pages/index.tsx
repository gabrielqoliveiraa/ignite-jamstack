import { GetStaticProps } from 'next';

import Prismic from '@prismicio/client';
import { RichText } from 'prismic-dom';

import { FiUser } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
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
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Header />

        {postsPagination.results.map((post: Post) => (
          <section key={post.data.title}>
            <h2>{post.data.title}</h2>
            <p>{post.data.subtitle}</p>
            <footer>
              <span>
                <FiCalendar /> 15 de março de 2021
              </span>
              <span>
                <FiUser /> {post.data.author}
              </span>
            </footer>
          </section>
        ))}

        {postsPagination.next_page ? (
          <button type="button">Carregar mais Posts</button>
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
      page: 1,
    }
  );

  const nextPage = postsResponse.next_page;

  const posts = postsResponse.results.map(post => {
    return {
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
    revalidate: 60 * 60,
  };
};
