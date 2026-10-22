#!/usr/bin/env python3
"""Render a local promo without spoken narration with original synthesized background music.

Uses the approved logo unchanged. No APIs, downloaded media, tracking or credentials.
Requires Pillow, numpy and ffmpeg; no dependencies are installed by this script.
"""
from __future__ import annotations

import argparse
import json
import math
from pathlib import Path
import subprocess
import wave

import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter

WIDTH, HEIGHT, FPS = 1080, 1920, 30
INK = '#173541'
TEAL = '#105F7E'
ORANGE = '#FF891A'
MUTED = '#526B76'
SCENES = [
    dict(seconds=4, label='COMPRAS COTIDIANAS', title=['¿Qué te falta', 'en casa?'],
         body=['Antes de salir,', 'poné tu lista en orden.'],
         points=['Tu lista.', 'Tu despensa.', 'Tus compras, más claras.']),
    dict(seconds=5, label='01  /  TU LISTA', title=['Anotá lo que', 'necesitás.'],
         body=['Agregá productos', 'con el teclado.'],
         points=['Elegí el producto.', 'Revisá presentación y cantidad.', 'Guardalo en tu lista.']),
    dict(seconds=5, label='02  /  TU DESPENSA', title=['Sabé qué tenés', 'en casa.'],
         body=['Registrá tus compras', 'y lo que vas consumiendo.'],
         points=['Llevá el control de existencias.', 'Conservá lo que queda pendiente.', 'Prepará tu próxima compra.']),
    dict(seconds=6, label='03  /  PRECIOS DISPONIBLES', title=['Compará antes', 'de elegir.'],
         body=['Consultá precios', 'por producto y sucursal.'],
         points=['Revisá marca y presentación.', 'Elegí tu localidad.', 'Consultá siempre fecha y fuente.'],
         note=['Según la cobertura disponible.', 'Confirmá el precio con el comercio.']),
    dict(seconds=5, label='04  /  TUS GASTOS', title=['Tus compras,', 'más claras.'],
         body=['Revisá el historial', 'y los importes que registraste.'],
         points=['Conocé tus gastos cargados.', 'Organizá tus próximas compras.', 'Todo junto a tu despensa.']),
    dict(seconds=5, label='DÓNDE RINDE', title=['Más orden', 'para tus compras.'],
         body=['Tu lista. Tu despensa.', 'Información para elegir.'],
         points=[], final=True),
]


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--logo', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--font', type=Path, default=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'))
    parser.add_argument('--bold-font', type=Path, default=Path('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'))
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    logo = Image.open(args.logo).convert('RGBA')

    def font(size, bold=False):
        return ImageFont.truetype(str(args.bold_font if bold else args.font), size)

    def fitted(text, size, max_width=900, bold=False):
        while font(size, bold).getlength(text) > max_width:
            size -= 1
        if size < 24:
            raise ValueError('Text cannot fit at a readable size: ' + text)
        return font(size, bold)

    for index, scene in enumerate(SCENES):
        # Restrained, reproducible background. The logo is only resized/composited.
        img = Image.new('RGB', (WIDTH, HEIGHT), '#F8FAFC')
        draw = ImageDraw.Draw(img)
        draw.ellipse((690, -230, 1330, 410), fill='#E8F1F5')
        draw.ellipse((-390, 1450, 480, 2320), fill='#EDF3F6')
        draw.rounded_rectangle((76, 85, 572, 146), radius=30, fill='#FFF0DF')
        draw.text((103, 99), 'BORRADOR · ANTES DEL LANZAMIENTO', font=font(23, True), fill='#89501C')
        small_logo = logo.resize((150, 150), Image.Resampling.LANCZOS)
        img.paste(small_logo, (68, 221), small_logo)
        draw.text((244, 258), 'Dónde Rinde', font=font(51, True), fill=TEAL)
        draw.rectangle((78, 419, 171, 430), fill=ORANGE)
        draw.text((78, 466), scene['label'], font=fitted(scene['label'], 31, bold=True), fill=TEAL)
        for row, text in enumerate(scene['title']):
            draw.text((72, 547 + row * 117), text, font=fitted(text, 88, bold=True), fill=INK)
        for row, text in enumerate(scene['body']):
            draw.text((78, 842 + row * 63), text, font=fitted(text, 43), fill=MUTED)

        if scene.get('final'):
            # A real logo and a future CTA, never a fake screenshot or store badge.
            large = logo.resize((330, 330), Image.Resampling.LANCZOS)
            img.paste(large, (375, 1035), large)
            draw.rounded_rectangle((76, 1450, 1004, 1560), radius=35, fill=TEAL)
            text = 'Próximamente en Google Play'
            tf = fitted(text, 42, 850, True)
            draw.text(((WIDTH - tf.getlength(text)) / 2, 1482), text, font=tf, fill='white')
        else:
            shadow = Image.new('RGBA', img.size)
            sd = ImageDraw.Draw(shadow)
            sd.rounded_rectangle((76, 1054, 1004, 1420), radius=42, fill=(20, 60, 80, 22))
            shadow = shadow.filter(ImageFilter.GaussianBlur(20))
            img = Image.alpha_composite(img.convert('RGBA'), shadow).convert('RGB')
            draw = ImageDraw.Draw(img)
            draw.rounded_rectangle((76, 1033, 1004, 1399), radius=42, fill='white')
            for row, text in enumerate(scene['points']):
                top = 1090 + row * 99
                draw.ellipse((112, top + 13, 129, top + 30), fill=ORANGE if row == 0 else TEAL)
                draw.text((156, top), text, font=fitted(text, 36, 800), fill=INK)
            for row, text in enumerate(scene.get('note', [])):
                draw.text((78, 1460 + row * 51), text, font=fitted(text, 31), fill=MUTED)

        # Keep meaningful copy above the area usually occupied by platform controls.
        for dot in range(len(SCENES)):
            x = 76 + dot * 159
            draw.rounded_rectangle((x, 1650, x + 137, 1659), radius=4, fill=TEAL if dot <= index else '#D8E4EA')
        draw.text((78, 1720), 'Pieza de trabajo · no publicada', font=font(29), fill=MUTED)
        draw.text((78, 1770), 'Funciones y disponibilidad sujetas al lanzamiento.', font=fitted('Funciones y disponibilidad sujetas al lanzamiento.', 28), fill=MUTED)
        img.save(args.output / f'scene-{index:02}.png')

    total_seconds = sum(s['seconds'] for s in SCENES)
    make_music(args.output / 'musica-original.wav', total_seconds)
    segments = []
    for index, scene in enumerate(SCENES):
        destination = args.output / f'scene-{index:02}.mp4'
        duration = scene['seconds']
        # Small camera movement, with short fades to the common background color.
        vf = (f"zoompan=z='min(1.018,1+on*0.0001)':x='iw/2-iw/zoom/2':y='ih/2-ih/zoom/2':d=1:s={WIDTH}x{HEIGHT}:fps={FPS}," +
              (f"fade=t=in:st=0:d=0.18:color=0xF8FAFC," if index else "") +
              f"fade=t=out:st={duration-.18}:d=0.18:color=0xF8FAFC,format=yuv420p")
        run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-loop', '1', '-framerate', str(FPS),
             '-i', str(args.output / f'scene-{index:02}.png'), '-vf', vf, '-t', str(duration),
             '-c:v', 'libx264', '-preset', 'fast', '-crf', '20', '-threads', '2', '-an', str(destination)])
        segments.append(destination)
        print(f'Rendered scene {index+1}/{len(SCENES)}', flush=True)
    concat = args.output / 'segments.txt'
    # Controlled generated basenames avoid shell/concat path interpolation.
    concat.write_text(''.join(f"file '{p.name}'\n" for p in segments))
    final = args.output / 'Donde_Rinde_promocion_borrador_01.mp4'
    run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '1', '-i', str(concat),
         '-i', str(args.output / 'musica-original.wav'), '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
         '-c:a', 'aac', '-b:a', '160k', '-af', 'loudnorm=I=-20:TP=-2:LRA=8', '-t', str(total_seconds),
         '-movflags', '+faststart', '-metadata', 'title=Dónde Rinde · borrador promocional',
         '-metadata', 'comment=Edición local con logo aprobado y música sintetizada original; sin locución ni video generativo.', str(final)])
    manifest = dict(width=WIDTH, height=HEIGHT, fps=FPS, durationSeconds=total_seconds, scenes=SCENES,
                    costs=dict(apiCalls=0, paidAssets=0, adSpend=0), narration=False, generativeVideo=False,
                    mockAppScreens=False, publicPosted=False, finalFile=final.name)
    (args.output / 'produccion.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
    print(final, flush=True)


def run(args):
    subprocess.run(args, check=True)


def make_music(destination: Path, seconds: int):
    """A new gentle synthesized chord bed. No music files or external models."""
    rate = 44100
    time = np.arange(seconds * rate) / rate
    left = np.zeros_like(time)
    right = np.zeros_like(time)
    # Common harmonic intervals, newly synthesized here; not a sampled recording.
    chords = [(130.8128, 164.8138, 195.9977), (110.0, 130.8128, 164.8138),
              (87.3071, 110.0, 130.8128), (97.9989, 123.4708, 146.8324)]
    for start in np.arange(0, seconds, 3.25):
        region = (time >= start) & (time < start + 4)
        local = time[region] - start
        envelope = (1-np.exp(-local*2)) * np.exp(-local*.7) * np.minimum(1, (4-local)*3)
        frequencies = chords[int(start/3.25) % len(chords)]
        for i, frequency in enumerate(frequencies):
            tone = (np.sin(2*math.pi*frequency*local) + .18*np.sin(4*math.pi*frequency*local)) * envelope * .055
            left[region] += tone * (1-.12*i)
            right[region] += tone * (.76+.1*i)
    fade = np.minimum(1, time/1.5) * np.minimum(1, (seconds-time)/2.5)
    stereo = np.stack([left*fade, right*fade], axis=1)
    assert np.max(np.abs(stereo)) < .8
    with wave.open(str(destination), 'wb') as output:
        output.setnchannels(2)
        output.setsampwidth(2)
        output.setframerate(rate)
        output.writeframes((stereo*32767).astype('<i2').tobytes())


if __name__ == '__main__':
    main()
