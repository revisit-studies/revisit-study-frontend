import React, {
  useState, useCallback,
} from 'react';

import AceEditor from 'react-ace';
import { Container, Group } from '@mantine/core';
import { startingStringsMap } from './startingStrings';

import 'ace-builds/src-noconflict/mode-hjson';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/mode-xml';
import 'ace-builds/src-noconflict/mode-yaml';
import 'ace-builds/src-noconflict/mode-toml';
import 'ace-builds/src-noconflict/mode-json5';
import 'ace-builds/src-noconflict/theme-github_dark';
import 'ace-builds/src-noconflict/ext-language_tools';
import { StimulusParams } from '../../../store/types';
// adding worker
function CodeEditorTest({ setAnswer, parameters }: StimulusParams<{language: string, imagePath: string | null, type: 'modifying' | 'writing' | 'reading'}, Record<string, never>>): React.ReactElement {
  const [code, setCode] = useState<string>(startingStringsMap[parameters.type + parameters.language]);

  const editorOnChange = useCallback((rawCode: string) => {
    setAnswer({
      status: true,
      answers: {
        code: rawCode,
        error: rawCode,
      },
    });

    setCode(rawCode);
  }, [setAnswer]);

  return (
    <Container>
      {/* 图片与代码编辑器部分 */}
      <Group gap={20}>
        {parameters.imagePath ? (
          <div style={{ flex: '0 0 60%' }}>
            <img
              src="/a-usability-study/assets/tasks/fig/config_write.png"
              alt="Example"
              style={{
                width: '100%',
                height: 'auto',
                objectFit: 'contain',
              }}
            />
          </div>
        ) : null }

        <AceEditor
          mode={parameters.language}
          width="100%"
          height="1000px"
          value={code}
          theme="github_dark"
          onChange={editorOnChange}
          name="UNIQUE_ID_OF_DIV"
          editorProps={{ $blockScrolling: true }}
        />

      </Group>

      {/* 验证状态显示 */}
    </Container>
  );
}

export default CodeEditorTest;
