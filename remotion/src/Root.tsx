import React from 'react';
import { Composition } from 'remotion';
import { DURACAO, Filme } from './Filme';
import { DUR_QUADRO, Quadro } from './Quadro';

export const Root: React.FC = () => (
  <>
    {/* Reels, Stories e Status do WhatsApp */}
    <Composition
      id="Reels"
      component={Filme}
      durationInFrames={DURACAO}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ vertical: true }}
    />
    {/* "A conta na folha": 90 s, uma mão escrevendo e somando */}
    <Composition
      id="Folha"
      component={Quadro}
      durationInFrames={DUR_QUADRO}
      fps={30}
      width={1920}
      height={1080}
    />
    {/* site e YouTube */}
    <Composition
      id="Wide"
      component={Filme}
      durationInFrames={DURACAO}
      fps={30}
      width={1920}
      height={1080}
      defaultProps={{ vertical: false }}
    />
  </>
);
