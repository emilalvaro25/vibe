/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import { useState, useMemo, useEffect, useRef } from 'react';

const SIMULATED_OUTPUT = {
    'npm install': `> npm install
added 125 packages, and audited 126 packages in 5s
found 0 vulnerabilities`,

    'npm run dev': `> my-app@0.0.1 dev
> next dev

  ▲ Next.js 14.2.3
  - Local:        http://localhost:3000
  - Environments: .env.local

 ✓ Ready in 4.2s
 ○ Compiling / ...`,

    'pip install -r requirements.txt': `> pip install -r requirements.txt
Collecting Flask>=2.0
  Downloading Flask-2.3.3-py3-none-any.whl (96 kB)
Collecting Jinja2>=3.0
  Downloading Jinja2-3.1.4-py3-none-any.whl (133 kB)
Successfully installed Flask-2.3.3 Jinja2-3.1.4`,

    'python': (filename) => `> python ${filename}
* Running on http://127.0.0.1:5000
(Press CTRL+C to quit)`
};

export default function Terminal({ files }) {
    const [output, setOutput] = useState('Welcome to the sandboxed terminal.\nClick a command to simulate running it.');
    const outputRef = useRef(null);

    useEffect(() => {
        if (outputRef.current) {
            outputRef.current.scrollTop = outputRef.current.scrollHeight;
        }
    }, [output]);

    const availableCommands = useMemo(() => {
        const commands = [];
        const packageJsonFile = files.find(f => f.path.endsWith('package.json'));
        const requirementsFile = files.find(f => f.path.endsWith('requirements.txt'));
        const pythonMainFile = files.find(f => f.path.endsWith('main.py') || f.path.endsWith('app.py'));

        if (packageJsonFile) {
            commands.push('npm install');
            try {
                const pkg = JSON.parse(packageJsonFile.content);
                if (pkg.scripts) {
                    commands.push(...Object.keys(pkg.scripts).map(s => `npm run ${s}`));
                }
            } catch (e) {
                console.error('Failed to parse package.json', e);
            }
        }

        if (requirementsFile) {
            commands.push('pip install -r requirements.txt');
        }

        if (pythonMainFile) {
            commands.push(`python ${pythonMainFile.path}`);
        }

        return commands;
    }, [files]);

    const handleCommandClick = (command) => {
        let result = `\n\n> ${command}\n`;
        if (command.startsWith('python')) {
            const filename = command.split(' ')[1];
            result += SIMULATED_OUTPUT['python'](filename);
        } else {
            result += SIMULATED_OUTPUT[command] || 'Command not found or not implemented in this sandbox.';
        }
        setOutput(prev => prev + result);
    };

    return (
        <div className="terminal-container">
            <div className="terminal-commands">
                {availableCommands.length > 0 ? (
                    availableCommands.map(cmd => (
                        <button key={cmd} className="command-button" onClick={() => handleCommandClick(cmd)}>
                            {cmd}
                        </button>
                    ))
                ) : (
                    <span style={{fontSize: '0.85rem', color: 'var(--muted)'}}>No runnable commands detected.</span>
                )}
            </div>
            <div className="terminal-output" ref={outputRef}>
                {output}
                 <div className="terminal-line">
                    <span className="terminal-prompt">~ $</span>
                    <span className="cursor"></span>
                </div>
            </div>
        </div>
    );
}