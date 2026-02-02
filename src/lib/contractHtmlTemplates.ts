// Default HTML Template for Adult Contracts (18+ years)
// This template includes all standard clauses and placeholders

export const ADULT_CONTRACT_TEMPLATE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Prestação de Serviços</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 2cm;
      max-width: 21cm;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2em;
      border-bottom: 2px solid #333;
      padding-bottom: 1em;
    }
    
    .header h1 {
      font-size: 14pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5em;
    }
    
    .header .academy-name {
      font-size: 16pt;
      font-weight: bold;
      color: #1a365d;
    }
    
    .parties {
      margin-bottom: 2em;
      padding: 1em;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .parties p {
      margin-bottom: 0.5em;
    }
    
    .parties strong {
      color: #1a365d;
    }
    
    h2 {
      font-size: 12pt;
      text-transform: uppercase;
      margin: 1.5em 0 0.5em 0;
      color: #1a365d;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25em;
    }
    
    p {
      text-align: justify;
      margin-bottom: 0.75em;
    }
    
    .clause-number {
      font-weight: bold;
    }
    
    .summary-box {
      margin: 1.5em 0;
      padding: 1em;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .summary-box h3 {
      font-size: 11pt;
      margin-bottom: 0.5em;
      color: #1a365d;
    }
    
    .summary-box ul {
      list-style: none;
      padding: 0;
    }
    
    .summary-box li {
      padding: 0.25em 0;
      border-bottom: 1px dotted #ddd;
    }
    
    .summary-box li:last-child {
      border-bottom: none;
    }
    
    .signatures {
      margin-top: 3em;
      page-break-inside: avoid;
    }
    
    .signature-line {
      margin-top: 3em;
      text-align: center;
    }
    
    .signature-line .line {
      border-top: 1px solid #333;
      width: 60%;
      margin: 0 auto 0.5em auto;
    }
    
    .signature-line p {
      text-align: center;
      font-size: 10pt;
    }
    
    .footer {
      margin-top: 2em;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="academy-name">{{ACADEMIA_NOME}}</p>
    <h1>Contrato de Prestação de Serviços de Treinamento Esportivo</h1>
  </div>

  <div class="parties">
    <p><strong>CONTRATANTE (ALUNO):</strong> {{ALUNO_NOME}}, CPF nº {{ALUNO_CPF}}, RG nº {{ALUNO_RG}}, nascido(a) em {{ALUNO_NASC}}, residente em {{ALUNO_ENDERECO}}, e-mail {{ALUNO_EMAIL}}, telefone {{ALUNO_TELEFONE}}.</p>
    
    <p><strong>CONTRATADA (ACADEMIA):</strong> {{ACADEMIA_NOME}}, {{ACADEMIA_RAZAO_SOCIAL}}, CNPJ nº {{ACADEMIA_CNPJ}}, com endereço em {{ACADEMIA_ENDERECO}}, e-mail {{ACADEMIA_EMAIL}}, WhatsApp {{ACADEMIA_WHATSAPP}}.</p>
  </div>

  <p>As partes acima identificadas firmam o presente contrato, que se regerá pelas cláusulas seguintes.</p>

  <h2>Cláusula 1 — Objeto</h2>
  <p><span class="clause-number">1.1.</span> O presente contrato tem por objeto a prestação de serviços esportivos pela CONTRATADA, consistentes na disponibilização de treinos/aulas de jiu-jítsu, conforme o plano contratado, horários e regras internas vigentes.</p>
  <p><span class="clause-number">1.2.</span> Este contrato não configura promessa de resultado físico, técnico, esportivo ou competitivo, sendo obrigação da CONTRATADA de meios, e não de resultado.</p>

  <h2>Cláusula 2 — Plano Contratado, Horários e Acesso</h2>
  <p><span class="clause-number">2.1.</span> O CONTRATANTE adere ao plano <strong>{{PLANO_NOME}}</strong>, no valor de <strong>{{PLANO_VALOR}}</strong>, com recorrência <strong>{{PLANO_RECORRENCIA}}</strong>, vencimento todo dia <strong>{{PLANO_VENCIMENTO_DIA}}</strong>, e vigência a partir de <strong>{{DATA_INICIO}}</strong>.</p>
  <p><span class="clause-number">2.2.</span> Horários e dias de acesso inclusos: <strong>{{HORARIOS}}</strong>.</p>
  <p><span class="clause-number">2.3.</span> A CONTRATADA poderá ajustar horários, turmas e professores por necessidade operacional, comunicando o CONTRATANTE com antecedência razoável, mantendo a oferta de treinos compatíveis.</p>

  <h2>Cláusula 3 — Matrícula, Mensalidade, Reajuste e Formas de Pagamento</h2>
  <p><span class="clause-number">3.1.</span> Se houver taxa de matrícula, aplica-se o valor de <strong>{{TAXA_MATRICULA}}</strong>.</p>
  <p><span class="clause-number">3.2.</span> O pagamento poderá ocorrer via {{FORMA_PAGAMENTO}} (Pix, cartão, boleto), conforme disponibilizado no sistema.</p>
  <p><span class="clause-number">3.3.</span> Reajustes: a CONTRATADA poderá reajustar valores em caso de renovação e/ou por alteração de custos, mediante comunicação prévia de {{PRAZO_AVISO_REAJUSTE}} dias.</p>
  <p><span class="clause-number">3.4.</span> O não pagamento implica restrição de acesso após {{DIAS_TOLERANCIA}} dias de atraso, sem prejuízo das cobranças previstas.</p>

  <h2>Cláusula 4 — Inadimplência (Multa, Juros e Cobrança)</h2>
  <p><span class="clause-number">4.1.</span> Em caso de atraso, incidirá multa de <strong>{{MULTA_ATRASO}}%</strong> sobre o valor devido, mais juros de <strong>{{JUROS_MENSAL}}% ao mês</strong>, proporcional aos dias de atraso, além de correção monetária quando aplicável.</p>
  <p><span class="clause-number">4.2.</span> A CONTRATADA poderá realizar cobranças por meios administrativos (mensagens, e-mail, telefone) e/ou encaminhar para cobrança externa, respeitada a legislação aplicável.</p>

  <h2>Cláusula 5 — Regras de Conduta, Segurança e Uso das Instalações</h2>
  <p><span class="clause-number">5.1.</span> O CONTRATANTE compromete-se a respeitar as regras internas, orientações de professores, normas de higiene, segurança, conduta e convivência.</p>
  <p><span class="clause-number">5.2.</span> É vedado acessar o tatame sob efeito de álcool, drogas ilícitas ou em condições que ofereçam risco a si ou a terceiros.</p>
  <p><span class="clause-number">5.3.</span> O CONTRATANTE responde por danos causados por ato voluntário, negligência ou descumprimento de regras.</p>

  <h2>Cláusula 6 — Saúde, Aptidão e Responsabilidade</h2>
  <p><span class="clause-number">6.1.</span> O CONTRATANTE declara estar apto(a) à prática esportiva, assumindo responsabilidade por informar condições médicas preexistentes e limitações.</p>
  <p><span class="clause-number">6.2.</span> Recomenda-se avaliação médica periódica. A CONTRATADA pode solicitar atestado quando identificar risco ou necessidade.</p>
  <p><span class="clause-number">6.3.</span> Lesões inerentes à prática esportiva podem ocorrer; a CONTRATADA compromete-se a orientar boas práticas e segurança, sem eliminar riscos inerentes ao esporte.</p>

  <h2>Cláusula 7 — Trancamento, Suspensão e Reposição</h2>
  <p><span class="clause-number">7.1.</span> Regras de trancamento: {{REGRAS_TRANCAMENTO}}.</p>
  <p><span class="clause-number">7.2.</span> Reposição de aulas: {{REGRAS_REPOSICAO}}.</p>
  <p><span class="clause-number">7.3.</span> Ausências do CONTRATANTE não geram abatimento automático, salvo previsão expressa do plano.</p>

  <h2>Cláusula 8 — Cancelamento e Rescisão</h2>
  <p><span class="clause-number">8.1.</span> O CONTRATANTE poderá solicitar cancelamento pelo sistema e/ou canais oficiais, com aviso prévio de <strong>{{AVISO_PREVIO_CANCELAMENTO}} dias</strong>.</p>
  <p><span class="clause-number">8.2.</span> Em contratos com fidelidade, aplica-se multa rescisória conforme regra: {{REGRA_FIDELIDADE}}.</p>
  <p><span class="clause-number">8.3.</span> A CONTRATADA poderá rescindir por descumprimento grave (conduta, agressões, risco, inadimplência reiterada), mediante registro e comunicação.</p>
  <p><span class="clause-number">8.4.</span> Valores já pagos e utilizados não são reembolsáveis, salvo previsão legal ou erro comprovado de cobrança.</p>

  <h2>Cláusula 9 — Proteção de Dados (LGPD)</h2>
  <p><span class="clause-number">9.1.</span> A CONTRATADA tratará os dados pessoais do CONTRATANTE para finalidades de: execução deste contrato, controle de acesso/frequência, gestão financeira, comunicação operacional, emissão de documentos, segurança e cumprimento de obrigações legais.</p>
  <p><span class="clause-number">9.2.</span> O tratamento se fundamenta, principalmente, na execução de contrato e no cumprimento de obrigação legal/regulatória, quando aplicável.</p>
  <p><span class="clause-number">9.3.</span> Compartilhamento: poderá ocorrer com fornecedores estritamente necessários, como provedor de assinatura eletrônica, meios de pagamento e armazenamento, sempre com medidas de segurança e finalidade compatível.</p>
  <p><span class="clause-number">9.4.</span> Retenção: os dados e documentos poderão ser mantidos pelo tempo necessário para execução contratual, obrigações legais e resguardo de direitos.</p>
  <p><span class="clause-number">9.5.</span> Direitos do titular: o CONTRATANTE pode solicitar confirmação de tratamento, acesso, correção, atualização e outras medidas previstas em lei, por meio do canal: {{ACADEMIA_EMAIL}}.</p>

  <h2>Cláusula 10 — Assinatura Eletrônica e Validade</h2>
  <p><span class="clause-number">10.1.</span> As partes reconhecem como válida a assinatura eletrônica realizada por meio da plataforma indicada pela CONTRATADA, com registro de autenticação, data/hora, evidências e trilha de auditoria.</p>
  <p><span class="clause-number">10.2.</span> O documento assinado eletronicamente possui validade jurídica, nos termos da legislação aplicável (Lei 14.063/2020 e MP 2.200-2/2001).</p>

  <h2>Cláusula 11 — Disposições Gerais</h2>
  <p><span class="clause-number">11.1.</span> Tolerâncias não constituem renúncia de direito.</p>
  <p><span class="clause-number">11.2.</span> Este contrato substitui entendimentos anteriores sobre o mesmo objeto.</p>
  <p><span class="clause-number">11.3.</span> Caso qualquer cláusula seja considerada inválida, as demais permanecem vigentes.</p>

  <h2>Cláusula 12 — Foro</h2>
  <p><span class="clause-number">12.1.</span> Fica eleito o foro da comarca de <strong>{{FORO_CIDADE_UF}}</strong>, para dirimir quaisquer controvérsias, com renúncia a outro, por mais privilegiado que seja.</p>

  <div class="summary-box">
    <h3>📋 Resumo do Plano</h3>
    <ul>
      <li><strong>Plano:</strong> {{PLANO_NOME}}</li>
      <li><strong>Valor:</strong> {{PLANO_VALOR}} / {{PLANO_RECORRENCIA}}</li>
      <li><strong>Vencimento:</strong> dia {{PLANO_VENCIMENTO_DIA}}</li>
      <li><strong>Horários:</strong> {{HORARIOS}}</li>
      <li><strong>Início:</strong> {{DATA_INICIO}}</li>
    </ul>
  </div>

  <p style="text-align: center; margin-top: 2em;"><strong>E, por estarem de acordo, as partes firmam o presente instrumento.</strong></p>
  <p style="text-align: center;">{{CIDADE}}, {{DATA_ASSINATURA}}.</p>

  <div class="signatures">
    <div class="signature-line">
      <div class="line"></div>
      <p><strong>{{ACADEMIA_NOME}}</strong></p>
      <p>CONTRATADA</p>
    </div>

    <div class="signature-line">
      <div class="line"></div>
      <p><strong>{{ALUNO_NOME}}</strong></p>
      <p>CONTRATANTE</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado eletronicamente pelo sistema de gestão da {{ACADEMIA_NOME}}.</p>
    <p>Assinatura eletrônica com validade jurídica conforme Lei 14.063/2020.</p>
  </div>
</body>
</html>
`;

// Minor contract template (includes guardian)
export const MINOR_CONTRACT_TEMPLATE = `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Contrato de Prestação de Serviços - Menor de Idade</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 11pt;
      line-height: 1.5;
      color: #1a1a1a;
      padding: 2cm;
      max-width: 21cm;
      margin: 0 auto;
      background: white;
    }
    
    .header {
      text-align: center;
      margin-bottom: 2em;
      border-bottom: 2px solid #333;
      padding-bottom: 1em;
    }
    
    .header h1 {
      font-size: 14pt;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 0.5em;
    }
    
    .header .academy-name {
      font-size: 16pt;
      font-weight: bold;
      color: #1a365d;
    }
    
    .minor-notice {
      background: #fff3cd;
      border: 1px solid #ffc107;
      border-radius: 4px;
      padding: 1em;
      margin-bottom: 1.5em;
      text-align: center;
    }
    
    .minor-notice strong {
      color: #856404;
    }
    
    .parties {
      margin-bottom: 2em;
      padding: 1em;
      background: #f8f9fa;
      border-radius: 4px;
    }
    
    .parties p {
      margin-bottom: 0.5em;
    }
    
    .parties strong {
      color: #1a365d;
    }
    
    h2 {
      font-size: 12pt;
      text-transform: uppercase;
      margin: 1.5em 0 0.5em 0;
      color: #1a365d;
      border-bottom: 1px solid #ddd;
      padding-bottom: 0.25em;
    }
    
    p {
      text-align: justify;
      margin-bottom: 0.75em;
    }
    
    .clause-number {
      font-weight: bold;
    }
    
    .guardian-section {
      background: #e8f4f8;
      border: 1px solid #17a2b8;
      border-radius: 4px;
      padding: 1em;
      margin: 1.5em 0;
    }
    
    .guardian-section h3 {
      color: #0c5460;
      margin-bottom: 0.5em;
    }
    
    .summary-box {
      margin: 1.5em 0;
      padding: 1em;
      border: 1px solid #ddd;
      border-radius: 4px;
      background: #fafafa;
    }
    
    .summary-box h3 {
      font-size: 11pt;
      margin-bottom: 0.5em;
      color: #1a365d;
    }
    
    .summary-box ul {
      list-style: none;
      padding: 0;
    }
    
    .summary-box li {
      padding: 0.25em 0;
      border-bottom: 1px dotted #ddd;
    }
    
    .summary-box li:last-child {
      border-bottom: none;
    }
    
    .signatures {
      margin-top: 3em;
      page-break-inside: avoid;
    }
    
    .signature-line {
      margin-top: 3em;
      text-align: center;
    }
    
    .signature-line .line {
      border-top: 1px solid #333;
      width: 60%;
      margin: 0 auto 0.5em auto;
    }
    
    .signature-line p {
      text-align: center;
      font-size: 10pt;
    }
    
    .footer {
      margin-top: 2em;
      text-align: center;
      font-size: 9pt;
      color: #666;
    }
    
    @media print {
      body {
        padding: 0;
      }
    }
  </style>
</head>
<body>
  <div class="header">
    <p class="academy-name">{{ACADEMIA_NOME}}</p>
    <h1>Contrato de Prestação de Serviços de Treinamento Esportivo</h1>
    <h1 style="color: #17a2b8; font-size: 12pt;">ALUNO MENOR DE IDADE</h1>
  </div>

  <div class="minor-notice">
    <strong>⚠️ ATENÇÃO:</strong> Este contrato envolve menor de idade e requer a assinatura obrigatória do responsável legal.
  </div>

  <div class="parties">
    <p><strong>CONTRATANTE (ALUNO MENOR):</strong> {{ALUNO_NOME}}, CPF nº {{ALUNO_CPF}}, RG nº {{ALUNO_RG}}, nascido(a) em {{ALUNO_NASC}}, residente em {{ALUNO_ENDERECO}}, e-mail {{ALUNO_EMAIL}}, telefone {{ALUNO_TELEFONE}}.</p>
    
    <p><strong>RESPONSÁVEL LEGAL:</strong> {{RESP_NOME}}, CPF nº {{RESP_CPF}}, RG nº {{RESP_RG}}, residente em {{RESP_ENDERECO}}, e-mail {{RESP_EMAIL}}, telefone {{RESP_TELEFONE}}, na qualidade de <strong>{{RESP_VINCULO}}</strong> do(a) menor acima identificado(a).</p>
    
    <p><strong>CONTRATADA (ACADEMIA):</strong> {{ACADEMIA_NOME}}, {{ACADEMIA_RAZAO_SOCIAL}}, CNPJ nº {{ACADEMIA_CNPJ}}, com endereço em {{ACADEMIA_ENDERECO}}, e-mail {{ACADEMIA_EMAIL}}, WhatsApp {{ACADEMIA_WHATSAPP}}.</p>
  </div>

  <p>As partes acima identificadas firmam o presente contrato, que se regerá pelas cláusulas seguintes.</p>

  <h2>Cláusula 1 — Objeto</h2>
  <p><span class="clause-number">1.1.</span> O presente contrato tem por objeto a prestação de serviços esportivos pela CONTRATADA, consistentes na disponibilização de treinos/aulas de jiu-jítsu para o ALUNO MENOR, conforme o plano contratado, horários e regras internas vigentes.</p>
  <p><span class="clause-number">1.2.</span> Este contrato não configura promessa de resultado físico, técnico, esportivo ou competitivo, sendo obrigação da CONTRATADA de meios, e não de resultado.</p>

  <h2>Cláusula 2 — Plano Contratado, Horários e Acesso</h2>
  <p><span class="clause-number">2.1.</span> O ALUNO MENOR adere ao plano <strong>{{PLANO_NOME}}</strong>, no valor de <strong>{{PLANO_VALOR}}</strong>, com recorrência <strong>{{PLANO_RECORRENCIA}}</strong>, vencimento todo dia <strong>{{PLANO_VENCIMENTO_DIA}}</strong>, e vigência a partir de <strong>{{DATA_INICIO}}</strong>.</p>
  <p><span class="clause-number">2.2.</span> Horários e dias de acesso inclusos: <strong>{{HORARIOS}}</strong>.</p>
  <p><span class="clause-number">2.3.</span> A CONTRATADA poderá ajustar horários, turmas e professores por necessidade operacional, comunicando o RESPONSÁVEL com antecedência razoável.</p>

  <div class="guardian-section">
    <h3>📋 Cláusula Especial — Disposições para Menor de Idade</h3>
    <p><span class="clause-number">E.1.</span> O RESPONSÁVEL LEGAL declara ser legalmente habilitado(a) e <strong>autoriza expressamente</strong> a participação do(a) menor nas atividades esportivas descritas neste contrato.</p>
    <p><span class="clause-number">E.2.</span> O RESPONSÁVEL assume ciência dos riscos inerentes à prática de artes marciais e compromete-se a fornecer informações médicas relevantes e contatos de emergência.</p>
    <p><span class="clause-number">E.3.</span> O RESPONSÁVEL responde civilmente por todas as obrigações financeiras e por eventuais danos causados pelo menor a terceiros ou às instalações, quando aplicável.</p>
    <p><span class="clause-number">E.4.</span> A assinatura do RESPONSÁVEL é condição de validade e eficácia deste contrato.</p>
    <p><span class="clause-number">E.5.</span> O RESPONSÁVEL autoriza a CONTRATADA a realizar primeiros socorros e acionar serviços de emergência em caso de acidente, comprometendo-se a manter contatos de emergência atualizados.</p>
  </div>

  <h2>Cláusula 3 — Matrícula, Mensalidade e Formas de Pagamento</h2>
  <p><span class="clause-number">3.1.</span> Se houver taxa de matrícula, aplica-se o valor de <strong>{{TAXA_MATRICULA}}</strong>.</p>
  <p><span class="clause-number">3.2.</span> O pagamento poderá ocorrer via {{FORMA_PAGAMENTO}}, conforme disponibilizado no sistema.</p>
  <p><span class="clause-number">3.3.</span> O não pagamento implica restrição de acesso após {{DIAS_TOLERANCIA}} dias de atraso.</p>

  <h2>Cláusula 4 — Inadimplência</h2>
  <p><span class="clause-number">4.1.</span> Em caso de atraso, incidirá multa de <strong>{{MULTA_ATRASO}}%</strong>, mais juros de <strong>{{JUROS_MENSAL}}% ao mês</strong>.</p>

  <h2>Cláusula 5 — Regras de Conduta e Segurança</h2>
  <p><span class="clause-number">5.1.</span> O ALUNO MENOR compromete-se a respeitar as regras internas, orientações de professores e normas de convivência.</p>
  <p><span class="clause-number">5.2.</span> A CONTRATADA zelará pela segurança e integridade do menor durante as atividades.</p>

  <h2>Cláusula 6 — Saúde e Aptidão</h2>
  <p><span class="clause-number">6.1.</span> O RESPONSÁVEL declara que o menor está apto(a) à prática esportiva, assumindo responsabilidade por informar condições médicas.</p>
  <p><span class="clause-number">6.2.</span> A CONTRATADA pode solicitar atestado médico quando necessário.</p>

  <h2>Cláusula 7 — Cancelamento</h2>
  <p><span class="clause-number">7.1.</span> O RESPONSÁVEL poderá solicitar cancelamento com aviso prévio de <strong>{{AVISO_PREVIO_CANCELAMENTO}} dias</strong>.</p>

  <h2>Cláusula 8 — Proteção de Dados (LGPD)</h2>
  <p><span class="clause-number">8.1.</span> A CONTRATADA tratará os dados pessoais do ALUNO MENOR e do RESPONSÁVEL para execução deste contrato e finalidades correlatas.</p>
  <p><span class="clause-number">8.2.</span> Canal de contato para exercício de direitos: {{ACADEMIA_EMAIL}}.</p>

  <h2>Cláusula 9 — Assinatura Eletrônica</h2>
  <p><span class="clause-number">9.1.</span> As partes reconhecem como válida a assinatura eletrônica, com registro de autenticação e trilha de auditoria.</p>

  <h2>Cláusula 10 — Foro</h2>
  <p><span class="clause-number">10.1.</span> Fica eleito o foro da comarca de <strong>{{FORO_CIDADE_UF}}</strong>.</p>

  <div class="summary-box">
    <h3>📋 Resumo do Plano</h3>
    <ul>
      <li><strong>Aluno:</strong> {{ALUNO_NOME}} (menor)</li>
      <li><strong>Responsável:</strong> {{RESP_NOME}} ({{RESP_VINCULO}})</li>
      <li><strong>Plano:</strong> {{PLANO_NOME}}</li>
      <li><strong>Valor:</strong> {{PLANO_VALOR}} / {{PLANO_RECORRENCIA}}</li>
      <li><strong>Horários:</strong> {{HORARIOS}}</li>
      <li><strong>Início:</strong> {{DATA_INICIO}}</li>
    </ul>
  </div>

  <p style="text-align: center; margin-top: 2em;"><strong>E, por estarem de acordo, as partes firmam o presente instrumento.</strong></p>
  <p style="text-align: center;">{{CIDADE}}, {{DATA_ASSINATURA}}.</p>

  <div class="signatures">
    <div class="signature-line">
      <div class="line"></div>
      <p><strong>{{ACADEMIA_NOME}}</strong></p>
      <p>CONTRATADA</p>
    </div>

    <div class="signature-line">
      <div class="line"></div>
      <p><strong>{{RESP_NOME}}</strong></p>
      <p>RESPONSÁVEL LEGAL</p>
    </div>

    <div class="signature-line">
      <div class="line"></div>
      <p><strong>{{ALUNO_NOME}}</strong></p>
      <p>ALUNO (ciência)</p>
    </div>
  </div>

  <div class="footer">
    <p>Documento gerado eletronicamente pelo sistema de gestão da {{ACADEMIA_NOME}}.</p>
    <p>Assinatura eletrônica com validade jurídica conforme Lei 14.063/2020.</p>
  </div>
</body>
</html>
`;
