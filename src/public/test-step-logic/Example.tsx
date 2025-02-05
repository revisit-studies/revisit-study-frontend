import { Text } from '@mantine/core';

import { StimulusParams } from '../../store/types';

export default function Example({ parameters }: StimulusParams<{n: number}>) {
  return <Text>{parameters?.n || '-1'}</Text>;
}
