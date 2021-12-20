import React from 'react';
import clsx from 'clsx';
import Layout from '@theme/Layout';
import { Typography, Grid, Button } from "@material-ui/core";
import { useTrail, animated, useSpring } from "react-spring";
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './index.module.css';
import resume from "../../static/files/CV_zh.pdf";
import Translate from "@docusaurus/core/lib/client/exports/Translate";
import useBaseUrl from "@docusaurus/core/lib/client/exports/useBaseUrl";

function HomepageHeader() {
  const context = useDocusaurusContext();
  const { siteConfig = {} } = context;

  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <h1 className="hero__title">{siteConfig.title}</h1>
        <p className="hero__subtitle">{siteConfig.tagline}</p>
      </div>
    </header>
  );
}

export default function Home() {
  const {siteConfig} = useDocusaurusContext();

  const animatedHero = useSpring({
    opacity: 1,
    transform: "translateX(0)",
    from: { opacity: 0, transform: "translateX(8em)" },
    config: { mass: 2, tension: 260, friction: 30 },
    delay: 600,
  });

  const animatedTexts = useTrail(5, {
    from: { opacity: 0, transform: "translateY(3em)" },
    to: { opacity: 1, transform: "translateY(0)" },
    config: {
      mass: 3,
      friction: 45,
      tension: 460,
    },
    delay: 200,
  });
  return (
    <Layout
      description="Description will go into a meta tag in <head />"
    >
    <Grid container spacing={2} style={{ padding: "5%" }} className="hero">
      <Grid item xs={12} lg={6} className="homeIntro">
        <animated.div style={animatedTexts[0]}>
          <Typography variant="h2" gutterBootom>
            <Translate>Hello! I am</Translate>
            <span className="intro__name"> CheverJohn </span>
          </Typography>
        </animated.div>
        <animated.div style = {animatedTexts[1]}>
          <Typography variant="body1">
            <Translate>
              A University graduate who has a great passion for Tech.
              While keeping updated with the most recent
              technologies, I always seek to improve and grow as a
              professional full-stack web developer as well as a person.
            </Translate>{" "}
          </Typography>
        </animated.div>
        &nbsp;
        <animated.p style={animatedTexts[3]}>
          <Button
            sytle-={{ textTransform: "none" }}
            color="primary"
            variant="outlined"
            size="small"
            href={resume}
            >
            <Translate>My Resume</Translate>
          </Button>
        </animated.p>
      </Grid>

      <Grid item xs={12} lg={6} className="homeImg">
        <animated.img
          src={useBaseUrl("img/programming.svg")}
          style={animatedHero}
          />
      </Grid>
    </Grid>
      {/*<HomepageHeader />*/}
      {/*<main>*/}
      {/*  <HomepageFeatures />*/}
      {/*</main>*/}
    </Layout>
  );
}
