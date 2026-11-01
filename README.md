# Borali — protótipo técnico

Protótipo web privado. Dados em IndexedDB exclusivamente no navegador. Não há Supabase, conta própria, calorias, PDF, metas ou peso nesta entrega. Mapas usam Leaflet e tiles OpenStreetMap; atribuição mantida, sem download em massa. Para produção ampliada, revisar quotas e provedor. GPS requer HTTPS e permissão; preview HTTP pode não oferecer GPS/service worker. Sensores de passos não são usados; passos exibidos são estimados somente após calibração informada.

Execução: servir dist/ via HTTPS. Testes: `node --test tests/core.test.mjs`.

Implementado: sessão ativa/pausa/fim, recuperação local, tempo ativo/pausado, GPS com filtro de precisão (35 m), salto (4,5 m/s), divisão de lacunas acima de 45 segundos e segmentos de pausa independentes. Limiares experimentais sujeitos a testes de caminhada reais. No segundo plano, coleta é interrompida explicitamente; tempo não representa prova de movimento. Backup JSON contém dados privados e ainda não tem importação. O histórico não inclui visualização individual do mapa nesta etapa.

Validação requerida nos aparelhos: Safari/iPhone e Chrome/Android, instalação na tela inicial, GPS em percurso conhecido, parado, sinal ruim, tela bloqueada e sem internet. Ícone SVG pode precisar de PNG para compatibilidade completa com iOS.

## Refinamento visual por referências
Cards com hierarquia de métricas, navegação flutuante, SVG local, gráfico semanal de tempo ativo derivado das sessões finalizadas. Ausência de GPS é indicada sem inventar zero. Tema e dados locais anteriores são preservados. Leaflet passa a carregar sob demanda; sem motor de animação adicional. Ícones PNG para instalação em iPhone/Android. QA em iframes 320,375,414,768: sem overflow horizontal. Sem pontuação Lighthouse medida; não declarar 95+.

## Nuvem e estimativas
Supabase Auth e RLS dedicados; conta autorizada selecionada pela usuária. SDK 2.57.4 carregado sob demanda de esm.sh somente ao conectar à nuvem. Não existe chave secreta no frontend. Sessões e perfil por documento com revisões otimistas. Login pessoal/entrega de confirmação de e-mail ainda precisam de teste real; salvar localmente não significa sincronizado.
Fisiologia: Compêndio 2024 (19–59 anos), energia ativa via (MET−1)×kg×horas. Esteira ACSM, v em m/min, G fracionário, conversão MET=VO₂/3,5 e convenção energética kcal/kg/h. Não somar a conversão alternativa de 5 kcal/L sobre a convenção adotada. Faixa implementada de esteira 3,2–5,6km/h e inclinação 0–30%; fora dela não estimar calorias. Estado estacionário é uma limitação do modelo, especialmente em intervalos curtos; não se trata de calorimetria direta.
Escadas substituem o tempo correspondente, não adicionam bônus duplicado. Sem duração não há estimativa total. Passos por distância usam calibração; razão empírica por altura é opcional e explicitamente aproximada. Sem GPS, faixa de passos só quando há ritmo informado e referência de passo; não fabrica distância geográfica. Perfil congelado por sessão. Correções preservam original e entram no relatório. PDF usa impressão nativa do navegador; não há arquivo PDF gerado pelo servidor. Metas e evolução histórica de pesagens seguem fora desta entrega.

## Ritmo livre e localização atual
Planejamento contínuo usa um trecho; intervalado permite vários. Cada linha aceita km + min, km + pace ou min + pace; o terceiro valor deve concordar (tolerância de 1 segundo/km para arredondamento). Campos derivados usam step=any para permitir reedição sem truncamento. Planejamento é separado do realizado: confirmação explícita no detalhe gera valores manuais, sem substituir rota GPS. Dados antigos permanecem legíveis.
Posição atual usa Geolocation API (getCurrentPosition), sem backend de IP e sem salvar o ponto de consulta como caminhada. Exibe marcador e círculo de precisão. WatchPosition continua na sessão; erro de permissão mostra orientação para abrir a URL HTTPS diretamente no Safari/Chrome quando o contexto embutido bloqueia acesso. Preview local HTTP não valida obtenção real de GPS.

## Análises de passos
Nova aba Análises: dia/semana/mês/ano/todo histórico. Totais estimados ou faixas preservadas, cobertura explícita e tabela acessível. Gráficos de barra e linha/pontos usam CSS/SVG. Horários são inferidos apenas de pares GPS com até 45s entre pontos, não de totais manuais. Arredondamento conserva a soma; pontos que cruzam hora ou dia são repartidos. Registros sem distribuição temporal são atribuídos ao dia de início e ficam fora do pico horário. Período diário pode ter total conhecido e gráfico horário sem dados, explicitamente identificado.
Ritmo contínuo agora oculta e desabilita os campos planejados, preservando valores na tela para eventual volta a Sim. Valores ocultos são ignorados ao iniciar, sem criação de metas implícitas.

## Publicação na Vercel

Site estático sem build. `vercel.json` publica somente `dist`. Rode `node --test tests/*.test.mjs`. Configure a URL de produção em Supabase Authentication > URL Configuration (Site URL e Redirect URLs). A chave publishable é pública por definição; a segurança depende das políticas RLS do banco. Nunca publique service_role, senhas ou backups pessoais. O SQL incluído é um modelo anonimizado, não uma migração para o banco existente.

Ao trocar de domínio, o IndexedDB local não é transferido: sincronize no domínio antigo ou exporte um backup antes de mudar.
