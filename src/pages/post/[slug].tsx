/* eslint-disable no-new-wrappers */
/* eslint-disable react/no-danger */
/* eslint-disable no-param-reassign */
/* eslint-disable no-return-assign */
import { GetStaticPaths, GetStaticProps } from 'next';
import Link from 'next/link';

import { format } from 'date-fns';
import { RichText } from 'prismic-dom';
import { FiCalendar, FiClock, FiUser } from 'react-icons/fi';
import { ptBR } from 'date-fns/locale';
import { useRouter } from 'next/router';
import Prismic from '@prismicio/client';
import { ReactElement, useEffect } from 'react';
import Header from '../../components/Header';

import { getPrismicClient } from '../../services/prismic';

import styles from './post.module.scss';

interface Post {
  nextPage: string;
  prevPage: string;
  first_publication_date: string | null;
  last_publication_date: string | null;
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
  navigation: {
    prevPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
    nextPost: {
      uid: string;
      data: {
        title: string;
      };
    }[];
  };
}

export default function Post({ post, navigation }: PostProps): ReactElement {
  const formatedNextPost = navigation.nextPost.map(posts => {
    return {
      uid: posts.uid,
      data: {
        title: RichText.asText(posts.data.title),
      },
    };
  });
  const formatedPrevPost = navigation.prevPost.map(posts => {
    return {
      uid: posts.uid,
      data: {
        title: RichText.asText(posts.data.title),
      },
    };
  });

  useEffect(() => {
    const script = document.createElement('script');
    const anchor = document.getElementById('inject-comments-for-uterances');
    script.setAttribute('src', 'https://utteranc.es/client.js');
    script.setAttribute('crossorigin', 'anonymous');
    script.setAttribute('async', new Boolean('true').toString());
    script.setAttribute('repo', 'gabrielqoliveiraa/ignite-jamstack');
    script.setAttribute('issue-term', 'pathname');
    script.setAttribute('theme', 'dark-blue');
    anchor.appendChild(script);
  }, []);

  const totalWords = post.data.content.reduce((total, contentItem) => {
    total += contentItem.heading.split(' ').length;

    const words = contentItem.body.map(item => item.text.split(' ').length);
    words.map(word => (total += word));
    return total;
  }, 0);
  const readTime = Math.ceil(totalWords / 200);

  const router = useRouter();

  const formatedDate = format(
    new Date(post.first_publication_date),
    'dd MMM yyyy',
    {
      locale: ptBR,
    }
  );

  if (router.isFallback) {
    return <h1>Carregando...</h1>;
  }
  return (
    <>
      <div className={styles.headerContainer}>
        <Header />
      </div>
      <img src={post.data.banner.url} alt="imagem" className={styles.banner} />
      <main className={styles.container}>
        <div className={styles.post}>
          <div className={styles.postTop}>
            <h1>{post.data.title}</h1>
            <ul>
              <li>
                <FiCalendar />
                {formatedDate}
              </li>
              <li>
                <FiUser />
                {post.data.author}
              </li>
              <li>
                <FiClock />
                {`${readTime} min`}
              </li>
            </ul>
            <p>* {post.last_publication_date}</p>
          </div>

          {post.data.content.map(content => {
            return (
              <article key={content.heading}>
                <h2>{content.heading}</h2>
                <div
                  className={styles.postContent}
                  dangerouslySetInnerHTML={{
                    __html: RichText.asHtml(content.body),
                  }}
                />
              </article>
            );
          })}
        </div>
        <hr />
        <section className={styles.navigation}>
          {navigation.nextPost.length > 0 && (
            <div>
              {formatedNextPost.map(title => (
                <>
                  <h3>{title.data.title}</h3>
                  <Link href={`/post/${title.uid}`}>
                    <a>Próximo Post</a>
                  </Link>
                </>
              ))}
            </div>
          )}

          {navigation.prevPost.length > 0 && (
            <div className={styles.prevPost}>
              {formatedPrevPost.map(title => (
                <>
                  <h3>{title.data.title}</h3>
                  <Link href={`/post/${title.uid}`}>
                    <a>Post Anterior</a>
                  </Link>
                </>
              ))}
            </div>
          )}
        </section>
        <div id="inject-comments-for-uterances" />
      </main>
    </>
  );
}

export const getStaticPaths: GetStaticPaths = async () => {
  const prismic = getPrismicClient();
  const posts = await prismic.query([
    Prismic.Predicates.at('document.type', 'posts'),
  ]);

  const paths = posts.results.map(post => {
    return {
      params: {
        slug: post.uid,
      },
    };
  });

  return {
    paths,
    fallback: 'blocking',
  };
};

export const getStaticProps: GetStaticProps = async context => {
  const prismic = getPrismicClient();
  const { slug } = context.params;
  const response = await prismic.getByUID('posts', String(slug), {});

  const nextPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.last_publication_date desc]',
    }
  );

  const prevPost = await prismic.query(
    [Prismic.Predicates.at('document.type', 'posts')],
    {
      pageSize: 1,
      after: response.id,
      orderings: '[document.first_publication_date]',
    }
  );

  const post = {
    uid: response.uid,
    last_publication_date: format(
      new Date(response.last_publication_date),
      "'editado' 'em' dd MMM yyy, 'às' HH:mm",
      {
        locale: ptBR,
      }
    ),
    first_publication_date: response.first_publication_date,
    data: {
      title: RichText.asText(response.data.title),
      subtitle: RichText.asText(response.data.subtitle),
      author: RichText.asText(response.data.author),
      banner: {
        url: response.data.banner.url,
      },
      content: response.data.content.map(content => {
        return {
          heading: content.heading,
          body: [...content.body],
        };
      }),
    },
  };

  return {
    props: {
      post,
      navigation: {
        prevPost: prevPost?.results,
        nextPost: nextPost?.results,
      },
    },
  };
};
