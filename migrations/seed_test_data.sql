-- =====================================================
-- seed_test_data.sql  (v2 — formato completo raw_responses)
-- Senha de todos os usuários: teste123
-- Hash: 289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36
-- =====================================================

-- ── Limpar dados de teste anteriores ──────────────────
DELETE FROM delivery_logs;
DELETE FROM calendar_bars;
DELETE FROM calendar_rows;
DELETE FROM calendars;
DELETE FROM calendar_requests;
DELETE FROM health_questionnaire;
DELETE FROM flock_data;
DELETE FROM farms;
DELETE FROM users WHERE role = 'user';

-- Admin para criação dos calendários entregues
INSERT OR IGNORE INTO users (id, email, name, role)
VALUES (99, 'leo@rebanho.local', 'Leo Pinto', 'admin');

-- ── 12 usuários de teste ───────────────────────────────
INSERT INTO users (id, email, name, role, password_hash) VALUES
(20,'joao.alves@email.com',       'João Ricardo Alves Santos',    'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(21,'maria.graca@email.com',      'Maria das Graças Ferreira',     'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(22,'antonio.lima@email.com',     'Antônio Carlos Pereira Lima',   'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(23,'ana.oliveira@email.com',     'Ana Cristina Souza Oliveira',   'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(24,'roberto.nascimento@email.com','Roberto Henrique Nascimento',   'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(25,'francisca.moreira@email.com','Francisca Aparecida Moreira',   'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(26,'luiz.barbosa@email.com',     'Luiz Fernando Costa Barbosa',   'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(27,'claudia.mendonca@email.com', 'Cláudia Regina Mendonça',       'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(28,'sergio.tavares@email.com',   'Sérgio Eduardo Tavares',        'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(29,'patricia.rodrigues@email.com','Patrícia Lúcia Rodrigues',     'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(30,'marcelo.goncalves@email.com','Marcelo Augusto Gonçalves',     'user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36'),
(31,'rosangela.cavalcanti@email.com','Rosângela Beatriz Cavalcanti','user','289160db0d9f39f9ae1754c4ec9c16f90b50e32e09c5fb5481ae642b3d3d1a36');

-- ── Propriedades ──────────────────────────────────────
INSERT INTO farms (id, user_id, name, city, state, notes) VALUES
(20,20,'Fazenda Bom Jesus',       'Corumbá',         'MS','CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento'),
(21,21,'Sítio Boa Esperança',     'Goiânia',         'GO','CICLO COMPLETO - 100% pasto'),
(22,22,'Fazenda Serra Verde',     'Uberaba',         'MG','CICLO COMPLETO - 100% pasto'),
(23,23,'Rancho dos Ipês',         'Sorocaba',        'SP','CICLO COMPLETO - 100% pasto'),
(24,24,'Fazenda Santa Rita',      'Cuiabá',          'MT','CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento'),
(25,25,'Sítio Cariri',            'Juazeiro do Norte','CE','CICLO COMPLETO - 100% pasto'),
(26,26,'Fazenda Barreiro',        'Barreiras',       'BA','CICLO COMPLETO - 100% pasto'),
(27,27,'Rancho do Cerrado',       'Patos de Minas',  'MG','CICLO COMPLETO - 100% pasto'),
(28,28,'Sítio Bela Vista',        'Ponta Grossa',    'PR','CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento'),
(29,29,'Fazenda Esperança',       'Palmas',          'TO','CICLO COMPLETO - 100% pasto'),
(30,30,'Estância Gaúcha',         'Bagé',            'RS','CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento'),
(31,31,'Sítio Mandacaru',         'Campina Grande',  'PB','CICLO COMPLETO - 100% pasto');

-- ── Dados do rebanho ──────────────────────────────────
INSERT INTO flock_data (id, farm_id, species, total_animals, housing_type, age_groups) VALUES
(20,20,'Dorper, Santa Inês',      95, 'Pasto e semi-confinamento','Reprodutores: 15 (Dorper, Santa Inês); Matrizes: 80 (Dorper, Mestiças)'),
(21,21,'Santa Inês, Mestiças',    53, 'Pasto extensivo',          'Reprodutores: 8 (Santa Inês); Matrizes: 45 (Santa Inês, Mestiças)'),
(22,22,'White Dorper, Santa Inês',72, 'Pasto extensivo',          'Reprodutores: 12 (White Dorper); Matrizes: 60 (White Dorper, Santa Inês)'),
(23,23,'Texel, Santa Inês',       65, 'Pasto extensivo',          'Reprodutores: 10 (Texel); Matrizes: 55 (Santa Inês, Texel)'),
(24,24,'Dorper, Santa Inês',     120, 'Pasto e semi-confinamento','Reprodutores: 20 (Dorper, Santa Inês); Matrizes: 100 (Dorper, Santa Inês, Mestiças)'),
(25,25,'Somalis, Morada Nova',    41, 'Pasto extensivo',          'Reprodutores: 6 (Somalis); Matrizes: 35 (Somalis, Morada Nova)'),
(26,26,'Dorper, Mestiças',       108, 'Pasto extensivo',          'Reprodutores: 18 (Dorper); Matrizes: 90 (Dorper, Mestiças)'),
(27,27,'White Dorper, Mestiças',  48, 'Pasto extensivo',          'Reprodutores: 8 (White Dorper, Santa Inês); Matrizes: 40 (White Dorper, Mestiças)'),
(28,28,'Texel, Merino',           60, 'Pasto e semi-confinamento','Reprodutores: 10 (Texel, Merino); Matrizes: 50 (Texel, Mestiças)'),
(29,29,'Santa Inês, Morada Nova', 84, 'Pasto extensivo',          'Reprodutores: 14 (Santa Inês); Matrizes: 70 (Santa Inês, Morada Nova)'),
(30,30,'Texel, Merino',          132, 'Pasto e semi-confinamento','Reprodutores: 22 (Texel, Merino); Matrizes: 110 (Texel, Mestiças)'),
(31,31,'Morada Nova, Santa Inês', 30, 'Pasto extensivo',          'Reprodutores: 5 (Morada Nova); Matrizes: 25 (Morada Nova, Santa Inês)');

-- ── Questionários sanitários (raw_responses completo) ─
INSERT INTO health_questionnaire (id, farm_id, veterinary_assistance, vaccination_history, additional_info, raw_responses) VALUES

-- 20 — João Ricardo — ATRASADO
(20,20,'Sim','Clostridiose, Raiva, Pneumonia','',
'{"nome":"João Ricardo Alves Santos","email":"joao.alves@email.com","instagram":"@joaoalves_rebanho","telefone":"(67) 99812-3344","nome_proprietario":"João Ricardo Alves Santos","nome_rebanho":"Fazenda Bom Jesus","inicio_criacao":"2018-03-10","qtd_reprodutores":"15","racas_reprodutores":["Dorper","Santa Inês"],"qtd_matrizes":"80","racas_matrizes":["Dorper","Mestiças"],"sistema_criacao":"CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento","pais":"Brasil","estado":"MS","cidade_brasil":"Corumbá","cidade_fora":"","propriedades_vizinhas":"Sim, vizinhos criam bovinos de corte e há risco de contato em áreas de divisa","meses_chuva":["NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["ABR","MAI","JUN"],"idade_apartacao":"75 dias","assistencia_vet":"Sim","possui_calendario":"Não","causas_obito":["Verminose","Morte súbita","Pneumonia"],"frequencia_obito":"Média","vacinas":["Clostridiose","Raiva","Pneumonia"],"decisao_compra":"Perdas repetidas por verminose me fizeram buscar um protocolo mais rigoroso e organizado","mortalidade_atual":"Perdi cerca de 12 animais no último ano de um total de 95 cabeças","ja_tentou":"Vermifugação aleatória sem critério e compra de vacinas sem orientação técnica","info_adicionais":"","espera_alcancar":"Reduzir mortalidade abaixo de 5% e ter um calendário que me guie mês a mês"}'),

-- 21 — Maria das Graças — ATRASADO
(21,21,'Não','Clostridiose, Foot-rot','',
'{"nome":"Maria das Graças Ferreira","email":"maria.graca@email.com","instagram":"@mariagraca_ovinocultura","telefone":"(62) 98734-2210","nome_proprietario":"Maria das Graças Ferreira","nome_rebanho":"Sítio Boa Esperança","inicio_criacao":"2020-07-15","qtd_reprodutores":"8","racas_reprodutores":["Santa Inês"],"qtd_matrizes":"45","racas_matrizes":["Santa Inês","Mestiças"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"GO","cidade_brasil":"Goiânia","cidade_fora":"","propriedades_vizinhas":"Não há vizinhos com rebanho próximo","meses_chuva":["NOV","DEZ","JAN","FEV"],"meses_monta":["MAR","ABR","MAI"],"idade_apartacao":"60 dias","assistencia_vet":"Não","possui_calendario":"Não","causas_obito":["Verminose","Cobra","Predadores"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Foot-rot"],"decisao_compra":"Quero profissionalizar a criação e parar de perder animais por falta de protocolo","mortalidade_atual":"Perdi 4 animais no último ano de um total de 53","ja_tentou":"Vermifugação a cada 3 meses sem FAMACHA e vacinação sem calendário fixo","info_adicionais":"","espera_alcancar":"Ter um guia mensal para não depender de lembrança e reduzir mortalidade"}'),

-- 22 — Antônio Carlos — ATRASADO
(22,22,'Sim','Clostridiose, Raiva, Linfadenite','Possui curral de manejo adaptado para ovinos',
'{"nome":"Antônio Carlos Pereira Lima","email":"antonio.lima@email.com","instagram":"@antoniolimaovinos","telefone":"(34) 99102-8876","nome_proprietario":"Antônio Carlos Pereira Lima","nome_rebanho":"Fazenda Serra Verde","inicio_criacao":"2016-01-20","qtd_reprodutores":"12","racas_reprodutores":["White Dorper"],"qtd_matrizes":"60","racas_matrizes":["White Dorper","Santa Inês"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"MG","cidade_brasil":"Uberaba","cidade_fora":"","propriedades_vizinhas":"Vizinhos criam bovinos leiteiros, sem ovinos próximos","meses_chuva":["OUT","NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["JUN","JUL"],"idade_apartacao":"70 dias","assistencia_vet":"Sim","possui_calendario":"Sim","causas_obito":["Verminose","Morte súbita","Intoxicação por plantas tóxicas"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Raiva","Linfadenite"],"decisao_compra":"Meu calendário atual é antigo e preciso de um atualizado com as práticas mais modernas","mortalidade_atual":"Aproximadamente 5 animais por ano de 72 cabeças","ja_tentou":"Calendário genérico da cooperativa que não se adequa bem ao meu sistema de criação","info_adicionais":"Possui curral de manejo adaptado para ovinos","espera_alcancar":"Calendário personalizado que considere minha estação de monta e condições climáticas regionais"}'),

-- 23 — Ana Cristina — PRAZO HOJE
(23,23,'Sim','Clostridiose, Raiva','',
'{"nome":"Ana Cristina Souza Oliveira","email":"ana.oliveira@email.com","instagram":"@anacristina_ovinos","telefone":"(15) 99345-6677","nome_proprietario":"Ana Cristina Souza Oliveira","nome_rebanho":"Rancho dos Ipês","inicio_criacao":"2021-09-01","qtd_reprodutores":"10","racas_reprodutores":["Texel"],"qtd_matrizes":"55","racas_matrizes":["Santa Inês","Texel"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"SP","cidade_brasil":"Sorocaba","cidade_fora":"","propriedades_vizinhas":"Propriedade isolada, sem criadores próximos","meses_chuva":["NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["ABR","MAI"],"idade_apartacao":"60 dias","assistencia_vet":"Sim","possui_calendario":"Não","causas_obito":["Verminose","Pneumonia","Predadores"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Raiva"],"decisao_compra":"Estou expandindo o rebanho e preciso de um protocolo sanitário bem estruturado","mortalidade_atual":"Perdi 3 animais no último ano de um total de 65","ja_tentou":"Apenas vacinação contra clostridiose sem calendário definido","info_adicionais":"","espera_alcancar":"Um calendário que me ajude a crescer o rebanho com segurança sanitária"}'),

-- 24 — Roberto Henrique — PRAZO HOJE
(24,24,'Sim','Clostridiose, Raiva, Pneumonia, Leptospirose','Propriedade em região de transição cerrado-pantanal',
'{"nome":"Roberto Henrique Nascimento","email":"roberto.nascimento@email.com","instagram":"@roberto_fazendaSantaRita","telefone":"(65) 99677-8899","nome_proprietario":"Roberto Henrique Nascimento","nome_rebanho":"Fazenda Santa Rita","inicio_criacao":"2014-04-05","qtd_reprodutores":"20","racas_reprodutores":["Dorper","Santa Inês"],"qtd_matrizes":"100","racas_matrizes":["Dorper","Santa Inês","Mestiças"],"sistema_criacao":"CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento","pais":"Brasil","estado":"MT","cidade_brasil":"Cuiabá","cidade_fora":"","propriedades_vizinhas":"Sim, há bovinocultura e caprinocultura nas propriedades vizinhas com contato frequente","meses_chuva":["NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["ABR","MAI","JUN"],"idade_apartacao":"80 dias","assistencia_vet":"Sim","possui_calendario":"Sim","causas_obito":["Verminose","Morte súbita","Cobra","Pneumonia"],"frequencia_obito":"Alta","vacinas":["Clostridiose","Raiva","Pneumonia","Leptospirose"],"decisao_compra":"Meu calendário atual não cobre todos os meses e falta vacinas importantes","mortalidade_atual":"Perdi cerca de 18 animais no último ano de um total de 120","ja_tentou":"Calendário básico da EMPAER com poucas adaptações para minha realidade","info_adicionais":"Propriedade em região de transição cerrado-pantanal","espera_alcancar":"Reduzir mortalidade pela metade e ter um protocolo completo por estação"}'),

-- 25 — Francisca Aparecida — PRAZO HOJE
(25,25,'Não','Clostridiose','',
'{"nome":"Francisca Aparecida Moreira","email":"francisca.moreira@email.com","instagram":"@francisca_capriovinosCariri","telefone":"(88) 98812-3344","nome_proprietario":"Francisca Aparecida Moreira","nome_rebanho":"Sítio Cariri","inicio_criacao":"2022-02-14","qtd_reprodutores":"6","racas_reprodutores":["Somalis"],"qtd_matrizes":"35","racas_matrizes":["Somalis","Morada Nova"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"CE","cidade_brasil":"Juazeiro do Norte","cidade_fora":"","propriedades_vizinhas":"Sim, região semiárida com muitos criadores, contato frequente em feiras e mercados","meses_chuva":["FEV","MAR","ABR","MAI"],"meses_monta":["SET","OUT","NOV"],"idade_apartacao":"50 dias","assistencia_vet":"Não","possui_calendario":"Não","causas_obito":["Verminose","Morte súbita","Intoxicação por plantas tóxicas"],"frequencia_obito":"Alta","vacinas":["Clostridiose"],"decisao_compra":"Estou começando a criar e preciso de orientação profissional desde o início","mortalidade_atual":"Perdi 5 animais no último semestre de 41 cabeças","ja_tentou":"Consulta pontual com vizinhos mais experientes e uso de vermífugo por conta própria","info_adicionais":"","espera_alcancar":"Aprender o manejo certo desde o início e ter um calendário adaptado ao semiárido"}'),

-- 26 — Luiz Fernando — PRÓXIMOS 7 DIAS
(26,26,'Sim','Clostridiose, Raiva, Foot-rot','',
'{"nome":"Luiz Fernando Costa Barbosa","email":"luiz.barbosa@email.com","instagram":"@luizfernando_barreiro","telefone":"(77) 99201-5566","nome_proprietario":"Luiz Fernando Costa Barbosa","nome_rebanho":"Fazenda Barreiro","inicio_criacao":"2017-06-30","qtd_reprodutores":"18","racas_reprodutores":["Dorper"],"qtd_matrizes":"90","racas_matrizes":["Dorper","Mestiças"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"BA","cidade_brasil":"Barreiras","cidade_fora":"","propriedades_vizinhas":"Sim, há bovinocultura de corte nas propriedades vizinhas","meses_chuva":["NOV","DEZ","JAN","FEV"],"meses_monta":["MAR","ABR"],"idade_apartacao":"70 dias","assistencia_vet":"Sim","possui_calendario":"Não","causas_obito":["Verminose","Morte súbita","Foot-rot"],"frequencia_obito":"Média","vacinas":["Clostridiose","Raiva","Foot-rot"],"decisao_compra":"Quero organizar o protocolo sanitário e parar de agir apenas quando o animal está doente","mortalidade_atual":"Perdi 10 animais no último ano de um total de 108","ja_tentou":"Tratamento reativo sem prevenção planejada e vermifugação sem critério técnico","info_adicionais":"","espera_alcancar":"Ter previsibilidade no manejo sanitário e reduzir perdas para menos de 5%"}'),

-- 27 — Cláudia Regina — PRÓXIMOS 7 DIAS
(27,27,'Sim','Clostridiose, Raiva, Linfadenite','Faz FAMACHA mensalmente',
'{"nome":"Cláudia Regina Mendonça","email":"claudia.mendonca@email.com","instagram":"@claudiamendonca_ovinos","telefone":"(34) 98456-1123","nome_proprietario":"Cláudia Regina Mendonça","nome_rebanho":"Rancho do Cerrado","inicio_criacao":"2019-11-10","qtd_reprodutores":"8","racas_reprodutores":["White Dorper","Santa Inês"],"qtd_matrizes":"40","racas_matrizes":["White Dorper","Mestiças"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"MG","cidade_brasil":"Patos de Minas","cidade_fora":"","propriedades_vizinhas":"Não há criadores de ovinos próximos, apenas pastagem de bovinos a 2 km","meses_chuva":["OUT","NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["MAI","JUN","JUL"],"idade_apartacao":"65 dias","assistencia_vet":"Sim","possui_calendario":"Não","causas_obito":["Verminose","Linfadenite","Morte súbita"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Raiva","Linfadenite"],"decisao_compra":"Faço FAMACHA mas não tenho protocolo de vacinação e vermifugação organizado","mortalidade_atual":"Perdi 2 animais no último ano de um total de 48","ja_tentou":"FAMACHA mensal mas sem calendário integrado de vacinas e outros manejos","info_adicionais":"Faz FAMACHA mensalmente","espera_alcancar":"Integrar o FAMACHA a um calendário completo e profissional"}'),

-- 28 — Sérgio Eduardo — PRÓXIMOS 7 DIAS
(28,28,'Sim','Clostridiose, Pneumonia, Leptospirose','Região com invernos rigorosos',
'{"nome":"Sérgio Eduardo Tavares","email":"sergio.tavares@email.com","instagram":"@sergiotavares_ovelhas","telefone":"(42) 99821-4455","nome_proprietario":"Sérgio Eduardo Tavares","nome_rebanho":"Sítio Bela Vista","inicio_criacao":"2015-08-20","qtd_reprodutores":"10","racas_reprodutores":["Texel","Merino"],"qtd_matrizes":"50","racas_matrizes":["Texel","Mestiças"],"sistema_criacao":"CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento","pais":"Brasil","estado":"PR","cidade_brasil":"Ponta Grossa","cidade_fora":"","propriedades_vizinhas":"Sim, há ovinos e bovinos nas propriedades vizinhas com eventual compartilhamento de pastagem","meses_chuva":["JUN","JUL","AGO","SET","OUT","NOV"],"meses_monta":["AGO","SET","OUT"],"idade_apartacao":"90 dias","assistencia_vet":"Sim","possui_calendario":"Sim","causas_obito":["Pneumonia","Morte súbita","Verminose"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Pneumonia","Leptospirose"],"decisao_compra":"O frio intenso no inverno aumenta a mortalidade e preciso de um protocolo sazonal","mortalidade_atual":"Perdi 4 animais no último ano de um total de 60","ja_tentou":"Aumento da suplementação no inverno mas sem calendário sanitário estruturado","info_adicionais":"Região com invernos rigorosos","espera_alcancar":"Protocolo que leve em conta o clima do sul e reduza mortalidade no inverno"}'),

-- 29 — Patrícia Lúcia — PRÓXIMOS 7 DIAS
(29,29,'Não','Clostridiose, Raiva','',
'{"nome":"Patrícia Lúcia Rodrigues","email":"patricia.rodrigues@email.com","instagram":"@patricialuciaovinos","telefone":"(63) 98734-7788","nome_proprietario":"Patrícia Lúcia Rodrigues","nome_rebanho":"Fazenda Esperança","inicio_criacao":"2020-04-18","qtd_reprodutores":"14","racas_reprodutores":["Santa Inês"],"qtd_matrizes":"70","racas_matrizes":["Santa Inês","Morada Nova"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"TO","cidade_brasil":"Palmas","cidade_fora":"","propriedades_vizinhas":"Sim, há bovinocultura de corte e pequena caprinocultura próximas","meses_chuva":["NOV","DEZ","JAN","FEV","MAR"],"meses_monta":["ABR","MAI","JUN"],"idade_apartacao":"60 dias","assistencia_vet":"Não","possui_calendario":"Não","causas_obito":["Verminose","Cobra","Morte súbita"],"frequencia_obito":"Média","vacinas":["Clostridiose","Raiva"],"decisao_compra":"Quero parar de perder animais por falta de prevenção e começar a ter controle real","mortalidade_atual":"Perdi 8 animais no último ano de um total de 84","ja_tentou":"Vermifugação semestral sem avaliação individual e vacinação apenas contra clostridiose","info_adicionais":"","espera_alcancar":"Um calendário que eu possa seguir de forma independente sem depender de veterinário"}'),

-- 30 — Marcelo Augusto — ENTREGUE
(30,30,'Sim','Clostridiose, Raiva, Pneumonia, Linfadenite','Trabalha com raças de dupla aptidão para carne e lã',
'{"nome":"Marcelo Augusto Gonçalves","email":"marcelo.goncalves@email.com","instagram":"@marcelo_estanciagaucha","telefone":"(53) 99456-2233","nome_proprietario":"Marcelo Augusto Gonçalves","nome_rebanho":"Estância Gaúcha","inicio_criacao":"2012-05-12","qtd_reprodutores":"22","racas_reprodutores":["Texel","Merino"],"qtd_matrizes":"110","racas_matrizes":["Texel","Mestiças"],"sistema_criacao":"CICLO COMPLETO - Pasto e parte do ano confinado ou semi-confinamento","pais":"Brasil","estado":"RS","cidade_brasil":"Bagé","cidade_fora":"","propriedades_vizinhas":"Sim, há grandes criadores de ovinos na região com excelente nível técnico","meses_chuva":["JUN","JUL","AGO","SET"],"meses_monta":["ABR","MAI","JUN"],"idade_apartacao":"90 dias","assistencia_vet":"Sim","possui_calendario":"Sim","causas_obito":["Pneumonia","Morte súbita","Verminose"],"frequencia_obito":"Baixa","vacinas":["Clostridiose","Raiva","Pneumonia","Linfadenite"],"decisao_compra":"Quero um calendário atualizado e personalizado para minha região e raças","mortalidade_atual":"Perdi 6 animais no último ano de um total de 132","ja_tentou":"Calendário de universidade federal adaptado mas sem personalização para minhas raças","info_adicionais":"Trabalha com raças de dupla aptidão para carne e lã","espera_alcancar":"Calendário personalizado por raça e estação que maximize produtividade e reduza perdas"}'),

-- 31 — Rosângela Beatriz — ENTREGUE
(31,31,'Não','Clostridiose','',
'{"nome":"Rosângela Beatriz Cavalcanti","email":"rosangela.cavalcanti@email.com","instagram":"@rosangela_mandacaru","telefone":"(83) 99201-4455","nome_proprietario":"Rosângela Beatriz Cavalcanti","nome_rebanho":"Sítio Mandacaru","inicio_criacao":"2023-01-08","qtd_reprodutores":"5","racas_reprodutores":["Morada Nova"],"qtd_matrizes":"25","racas_matrizes":["Morada Nova","Santa Inês"],"sistema_criacao":"CICLO COMPLETO - 100% pasto","pais":"Brasil","estado":"PB","cidade_brasil":"Campina Grande","cidade_fora":"","propriedades_vizinhas":"Sim, vários pequenos criadores de caprinos e ovinos na região","meses_chuva":["FEV","MAR","ABR","MAI"],"meses_monta":["JUN","JUL","AGO"],"idade_apartacao":"45 dias","assistencia_vet":"Não","possui_calendario":"Não","causas_obito":["Verminose","Morte súbita","Intoxicação por plantas tóxicas"],"frequencia_obito":"Alta","vacinas":["Clostridiose"],"decisao_compra":"Recebi indicação do Léo Pinto por uma amiga criadora e me convenci ao ver os resultados dela","mortalidade_atual":"Perdi 4 animais no último semestre de 30 cabeças, alta mortalidade para o tamanho do rebanho","ja_tentou":"Nada estruturado, apenas vacinação esporádica contra clostridiose","info_adicionais":"","espera_alcancar":"Ter controle sanitário e conseguir aumentar o rebanho de forma saudável e sustentável"}');

-- ── Solicitações ──────────────────────────────────────
-- 3 ATRASADAS (prazo no passado)
INSERT INTO calendar_requests (id, user_id, farm_id, status, deadline, created_at) VALUES
(20,20,20,'pending',     date('now','-9 day'),  datetime('now','-16 day')),
(21,21,21,'in_progress', date('now','-7 day'),  datetime('now','-14 day')),
(22,22,22,'pending',     date('now','-5 day'),  datetime('now','-12 day'));

-- 3 PRAZO HOJE
INSERT INTO calendar_requests (id, user_id, farm_id, status, deadline, created_at) VALUES
(23,23,23,'pending',     date('now'),           datetime('now','-7 day')),
(24,24,24,'in_progress', date('now'),           datetime('now','-9 day')),
(25,25,25,'pending',     date('now'),           datetime('now','-6 day'));

-- 4 PRÓXIMOS 7 DIAS
INSERT INTO calendar_requests (id, user_id, farm_id, status, deadline, created_at) VALUES
(26,26,26,'pending',     date('now','+1 day'),  datetime('now','-5 day')),
(27,27,27,'in_progress', date('now','+2 day'),  datetime('now','-4 day')),
(28,28,28,'pending',     date('now','+4 day'),  datetime('now','-3 day')),
(29,29,29,'in_progress', date('now','+6 day'),  datetime('now','-2 day'));

-- 2 ENTREGUES
INSERT INTO calendar_requests (id, user_id, farm_id, status, deadline, created_at) VALUES
(30,30,30,'delivered',   date('now','-19 day'), datetime('now','-28 day')),
(31,31,31,'delivered',   date('now','-14 day'), datetime('now','-22 day'));

-- ── Calendários para os entregues ─────────────────────
INSERT INTO calendars (id, request_id, template_id, status, created_by, published_at) VALUES
(1, 30, 1, 'published', 99, datetime('now','-17 day')),
(2, 31, 1, 'published', 99, datetime('now','-12 day'));
