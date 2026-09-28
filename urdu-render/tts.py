# edge-tts driver — self-contained replacement for quarry-render's edge_batch.py.
# Input:  <work>/tts-input.json  = [{i, text}, ...]
# Output: <work>/beat-NN.mp3 + <work>/tts-durations.json = [{i, ms, words:[{w,s,d}]}]
# (ms ints; s/d are per-word offsets/durations in ms — same shape edge_batch writes,
#  so DocShort caption timing stays compatible.)
# Env: TTS_VOICE (default ur-PK-AsadNeural), TTS_RATE (default -2%)
# Usage: python tts.py <workdir>
import json, os, sys, asyncio
import edge_tts

work = sys.argv[1]
voice = os.environ.get('TTS_VOICE', 'ur-PK-AsadNeural')
rate = os.environ.get('TTS_RATE', '-2%')
beats = json.load(open(os.path.join(work, 'tts-input.json'), encoding='utf-8'))

async def one(b):
    out = os.path.join(work, 'beat-%02d.mp3' % b['i'])
    last = None
    for attempt in range(4):
        words = []
        try:
            com = edge_tts.Communicate(b['text'], voice, rate=rate, boundary='WordBoundary')
            with open(out, 'wb') as f:
                async for ch in com.stream():
                    if ch['type'] == 'audio':
                        f.write(ch['data'])
                    elif ch['type'] == 'WordBoundary':
                        words.append({'w': ch['text'], 's': ch['offset'] // 10**4, 'd': ch['duration'] // 10**4})
            if os.path.getsize(out) > 10000 and words:
                end = words[-1]['s'] + words[-1]['d']
                print('tts ok beat %d (%d ms, %d words)' % (b['i'], end, len(words)), flush=True)
                return {'i': b['i'], 'ms': end, 'words': words}
            last = 'silent beat (%d bytes)' % os.path.getsize(out)
        except Exception as e:
            last = str(e)[:90]
        if attempt < 3:
            await asyncio.sleep(2 * (attempt + 1))
    raise RuntimeError('TTS failed beat %d after retries: %s' % (b['i'], last))

async def main():
    rs = []
    for b in beats:            # sequential — edge-tts rate-limits parallel streams
        rs.append(await one(b))
    json.dump(rs, open(os.path.join(work, 'tts-durations.json'), 'w', encoding='utf-8'), ensure_ascii=False)
    print('tts-durations.json written (%d beats)' % len(rs), flush=True)

asyncio.run(main())
