export const DEFAULT_CONTRACT_TEMPLATE = `
<h1 style="text-align: center;">CONTRATO DE MATRÍCULA</h1>

<h2 style="text-align: center;">{{academy_name}}</h2>

<p><strong>CONTRATADA:</strong> {{academy_name}}, estabelecida à {{academy_address}}, telefone {{academy_phone}}.</p>

<p><strong>CONTRATANTE:</strong> {{responsible_name}}, CPF nº {{student_cpf}}, responsável pelo(a) aluno(a) {{student_name}}, nascido(a) em {{student_birthdate}}.</p>

<h3>CLÁUSULA PRIMEIRA - DO OBJETO</h3>
<p>O presente contrato tem por objeto a prestação de serviços de ensino e prática de Jiu-Jitsu Brasileiro, sob orientação de instrutores qualificados da CONTRATADA.</p>

<h3>CLÁUSULA SEGUNDA - DA VIGÊNCIA</h3>
<p>Este contrato tem vigência indeterminada, a partir da data de sua assinatura, podendo ser rescindido por qualquer das partes mediante aviso prévio de 30 (trinta) dias.</p>

<h3>CLÁUSULA TERCEIRA - DAS OBRIGAÇÕES DA CONTRATADA</h3>
<p>A CONTRATADA se obriga a:</p>
<ul>
  <li>Fornecer ambiente adequado para a prática da atividade;</li>
  <li>Disponibilizar instrutores qualificados;</li>
  <li>Manter os equipamentos em bom estado de conservação;</li>
  <li>Comunicar eventuais alterações de horários com antecedência mínima de 48 horas.</li>
</ul>

<h3>CLÁUSULA QUARTA - DAS OBRIGAÇÕES DO CONTRATANTE</h3>
<p>O CONTRATANTE se obriga a:</p>
<ul>
  <li>Efetuar o pagamento da mensalidade até o vencimento estabelecido;</li>
  <li>Comunicar qualquer problema de saúde que possa afetar a prática esportiva;</li>
  <li>Zelar pelos equipamentos e instalações;</li>
  <li>Respeitar as normas internas da academia;</li>
  <li>Usar vestimenta adequada (kimono) durante os treinos.</li>
</ul>

<h3>CLÁUSULA QUINTA - DO PAGAMENTO</h3>
<p>O CONTRATANTE pagará à CONTRATADA o valor da mensalidade conforme plano escolhido, até o dia do vencimento de cada mês. O atraso no pagamento acarretará:</p>
<ul>
  <li>Multa de 2% sobre o valor devido;</li>
  <li>Juros de 1% ao mês;</li>
  <li>Após 3 (três) dias de atraso, o acesso poderá ser suspenso até a regularização.</li>
</ul>

<h3>CLÁUSULA SEXTA - DA RESPONSABILIDADE</h3>
<p>A CONTRATADA não se responsabiliza por:</p>
<ul>
  <li>Objetos pessoais deixados nas dependências;</li>
  <li>Lesões decorrentes da prática esportiva, desde que observadas as normas de segurança;</li>
  <li>Acidentes ocorridos por imprudência ou descumprimento das regras.</li>
</ul>

<h3>CLÁUSULA SÉTIMA - DA RESCISÃO</h3>
<p>O presente contrato poderá ser rescindido por:</p>
<ul>
  <li>Acordo entre as partes;</li>
  <li>Inadimplência por período superior a 60 dias;</li>
  <li>Descumprimento de qualquer cláusula contratual;</li>
  <li>Comportamento inadequado ou desrespeito às normas da academia.</li>
</ul>

<h3>CLÁUSULA OITAVA - DO FORO</h3>
<p>As partes elegem o foro da comarca onde se situa a academia para dirimir quaisquer dúvidas oriundas deste contrato.</p>

<p style="text-align: center; margin-top: 40px;">
  <strong>{{academy_address}}, {{date}}</strong>
</p>

<div style="margin-top: 60px; display: flex; justify-content: space-between;">
  <div style="width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
    <strong>CONTRATANTE</strong><br/>
    {{responsible_name}}
  </div>
  <div style="width: 45%; text-align: center; border-top: 1px solid #000; padding-top: 10px;">
    <strong>CONTRATADA</strong><br/>
    {{academy_name}}
  </div>
</div>
`;
