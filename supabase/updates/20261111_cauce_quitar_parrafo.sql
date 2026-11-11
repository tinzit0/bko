-- Quita de la descripción de CAUCE el párrafo «En la documentación analizada, Luis Miranda Chavarría figura como emisor…».
update bko_content
set data = jsonb_set(
      data,
      '{description}',
      to_jsonb(trim(replace(
        replace(data->>'description',
          chr(10) || chr(10) || 'En la documentación analizada, Luis Miranda Chavarría figura como emisor y contacto de Cauce Gestión Integral SpA en la preparación y entrega de antecedentes de cobranza.', ''),
        'En la documentación analizada, Luis Miranda Chavarría figura como emisor y contacto de Cauce Gestión Integral SpA en la preparación y entrega de antecedentes de cobranza.', '')))
    ),
    revision = revision + 1,
    updated_at = now()
where id = 'cauce'
  and data->>'description' like '%figura como emisor y contacto de Cauce%';
