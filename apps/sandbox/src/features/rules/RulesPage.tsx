import { ENEMY_BY_POINTS, HULL_DAMAGE_BY_POINTS, HULL_MAX, SHIELD_MAX } from "@osb/gameplay";
import type { Points } from "@osb/gameplay";

const POINTS: Points[] = [1, 2, 3];

const ENEMY_NAME: Record<(typeof ENEMY_BY_POINTS)[Points], string> = {
  scout: "scout (pequeño)",
  fighter: "fighter (mediano)",
  cruiser: "cruiser (grande)",
};

const cell = "border border-slate-800 px-3 py-2 align-top";
const head = `${cell} bg-slate-900 text-left font-semibold`;

export function RulesPage() {
  return (
    <article className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-8 leading-relaxed">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Reglas del escenario</h1>
        <p className="text-slate-300">
          Cómo se traduce un partido real de la NBA en la batalla espacial. Todo lo que pasa en pantalla sale de las
          jugadas del partido; el espectador no controla la nave.
        </p>
      </header>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">La nave y mi equipo</h2>
        <p>
          Al empezar se elige un partido grabado, un jugador y una misión. El equipo de ese jugador es{" "}
          <strong>mi equipo</strong>: su nave es la que vemos a la izquierda. El rival aparece como una escuadra de
          naves enemigas a la derecha.
        </p>
        <p>
          La nave empieza con el casco al {HULL_MAX}&nbsp;% y sin escudo. El partido se reproduce acelerado y cada jugada
          dispara una acción en la nave.
        </p>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">De jugada a acción</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={head}>Jugada</th>
              <th className={head}>Mi equipo</th>
              <th className={head}>Equipo rival</th>
            </tr>
          </thead>
          <tbody>
            {POINTS.map((p) => (
              <tr key={p}>
                <th scope="row" className={`${cell} text-left font-medium`}>
                  Canasta de {p} {p === 1 ? "punto" : "puntos"}
                </th>
                <td className={cell}>La nave destruye un enemigo {ENEMY_NAME[ENEMY_BY_POINTS[p]]}.</td>
                <td className={cell}>
                  Casco -{HULL_DAMAGE_BY_POINTS[p]}. Si hay escudo, una carga absorbe el golpe y el casco no baja.
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row" className={`${cell} text-left font-medium`}>Tapón o robo</th>
              <td className={cell}>Suma una carga de escudo (máximo {SHIELD_MAX}).</td>
              <td className={cell}>Un disparo nuestro falla: el enemigo esquiva.</td>
            </tr>
            <tr>
              <th scope="row" className={`${cell} text-left font-medium`}>Pérdida de balón</th>
              <td className={cell}>La nave se traba un momento y el combo vuelve a cero.</td>
              <td className={cell}>Un enemigo sufre una avería y se sale de formación.</td>
            </tr>
          </tbody>
        </table>
        <ul className="list-disc pl-6 text-slate-300">
          <li>
            Si quien anota es <strong>mi jugador</strong>, el disparo sale cargado (más grande y dorado) y el combo sube
            uno. Cualquier canasta rival pone el combo a cero.
          </li>
          <li>El casco nunca baja de 1: la nave aguanta hasta el final del partido pase lo que pase.</li>
          <li>Cuartos, rachas, tiempos muertos y faltas no tienen efecto en esta versión.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">La misión</h2>
        <p>
          La misión es un objetivo numérico sobre una estadística de <strong>mi jugador</strong>: puntos, tapones o
          robos (por ejemplo, 20 puntos). Solo cuentan las jugadas de ese jugador; las de sus compañeros mueven la nave
          pero no suman a la misión.
        </p>
        <ul className="list-disc pl-6 text-slate-300">
          <li>En cuanto el contador llega al objetivo la misión se marca cumplida y aparece el aviso en pantalla.</li>
          <li>Una vez cumplida no se puede perder, aunque el jugador pierda balones o el casco quede al mínimo.</li>
          <li>
            Al terminar el partido: misión cumplida, la nave salta al hiperespacio y el resultado es{" "}
            <strong>victoria</strong>; misión no cumplida, la nave explota y el resultado es <strong>derrota</strong>.
          </li>
          <li>El combo, los enemigos destruidos y el marcador del partido no influyen en el resultado.</li>
        </ul>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-semibold">Qué muestra la pantalla</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr>
              <th className={head}>Indicador</th>
              <th className={head}>Significado</th>
            </tr>
          </thead>
          <tbody>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>HULL</th><td className={cell}>Casco de la nave, de 1 a {HULL_MAX}. Con poco casco la nave muestra daños y la pantalla se oscurece por los bordes.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>SHIELD</th><td className={cell}>Cargas de escudo disponibles ({SHIELD_MAX} puntos). Cada carga absorbe una canasta rival.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>COMBO</th><td className={cell}>Canastas seguidas de mi jugador sin que el rival anote ni él pierda el balón. Solo informativo.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>Marcador y reloj</th><td className={cell}>Marcador real del partido y tiempo del cuarto. Mi equipo aparece en cian.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>MISSION</th><td className={cell}>Estadística elegida, valor actual y objetivo. Una marca ✓ indica misión cumplida.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>KILLS</th><td className={cell}>Enemigos destruidos por todo mi equipo. Solo informativo.</td></tr>
            <tr><th scope="row" className={`${cell} text-left font-medium`}>Rótulos flotantes</th><td className={cell}>Cada acción muestra la jugada que la causó, con el apellido del jugador: cian para mi equipo, dorado para mi jugador, rojo para el rival.</td></tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}
