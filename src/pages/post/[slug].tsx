import { GetStaticPaths, GetStaticProps } from 'next';
import { RichText } from 'prismic-dom';
import { format, formatRelative } from 'date-fns';
import ptBR from 'date-fns/locale/pt-BR';


import { FiUser } from 'react-icons/fi';
import { FiClock } from 'react-icons/fi';
import { FiCalendar } from 'react-icons/fi';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import commonStyles from '../../styles/common.module.scss';
import styles from './post.module.scss';

interface Post {
  first_publication_date: string | null;
  data: {
    title: string;
    banner: {
      url: string;
    };
    author: string;
    content: {
      heading: string;
      body: {
        text: string;
      }[];
    }[];
  };
}

interface PostProps {
  post: Post;
}

export default function Post({ post }: PostProps): JSX.Element {
  return (
    <>
      <div className={styles.headerContainer}>
        <Header />
      </div>

      <img className={styles.ImageContent} src={post.data.banner.url} alt="" />

      <main className={styles.content}>
        <article>
          <h1>{post.data.title}</h1>
          <time>
            {' '}
            <FiCalendar /> {post.first_publication_date}
            <FiUser /> {post.data.author}
            <FiClock /> 4 min
          </time>

          {post.data.content.map(content => (
            <>
              <h2 key={content.heading}>{content.heading}</h2>
              <div dangerouslySetInnerHTML={{ __html: content.body.text }} />
            </>
          ))}
        </article>
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async ({ params }) => {
  const prismic = getPrismicClient();
  const { slug } = params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const test = response.data.content.map(content => {
    return {
      heading: content.heading,
      body: { text: RichText.asHtml(content.body) },
    };
  });

  let date = new Date(response.first_publication_date)
  let today = new Date()

  let dateClock = formatRelative(date, today, {locale: ptBR})

  const post = {

    first_publication_date: format(date, "dd MMMM yyyy", {locale: ptBR}),

    data: {
      title: RichText.asText(response.data.title),
      banner: { url: response.data.banner.url },
      author: RichText.asText(response.data.author),
      content: test,
    },
  };

  return {
    props: {
      post,
    },
  };
};
