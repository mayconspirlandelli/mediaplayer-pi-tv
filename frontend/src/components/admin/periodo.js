// "Tempo indeterminado" é gravado como um período que nunca vence:
// de hoje até DATA_FIM_INDETERMINADA, o dia todo, todos os dias.
export const DATA_FIM_INDETERMINADA = '2099-12-31';
export const TODOS_OS_DIAS = '0,1,2,3,4,5,6';

// Data local (toISOString usaria UTC e viraria o dia depois das 21h no Brasil)
export function hojeLocal() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function isIndeterminado(schedule) {
  return schedule?.data_fim === DATA_FIM_INDETERMINADA;
}

export function periodoIndeterminado(dataInicio) {
  return {
    data_inicio: dataInicio || hojeLocal(),
    data_fim: DATA_FIM_INDETERMINADA,
    hora_inicio: '00:00:00',
    hora_fim: '23:59:59',
    dias_semana: TODOS_OS_DIAS,
  };
}
