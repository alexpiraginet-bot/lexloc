import React from 'react';
import { Composition } from 'remotion';
import { DUR_QUADRO, Quadro } from './Quadro';

/*
 * Uma peça só, de propósito.
 *
 * Havia três — Reels 30 s, Wide 30 s e a Folha de 90 s — o mesmo arco contado
 * três vezes, 30 MB somados. Os dois primeiros eram a versão fraca: mesma
 * narrativa, sem a mão e sem a folha. Ficou a Folha, e curta.
 */
export const Root: React.FC = () => (
  <>
    <Composition
      id="Folha"
      component={Quadro}
      durationInFrames={DUR_QUADRO}
      fps={30}
      width={1920}
      height={1080}
    />
  </>
);
