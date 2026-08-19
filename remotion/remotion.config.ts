import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
/* o contêiner e o CI não têm o Chrome do Remotion; usa-se o que a máquina tem */
if (process.env.LEXGO_CHROMIUM) Config.setBrowserExecutable(process.env.LEXGO_CHROMIUM);
