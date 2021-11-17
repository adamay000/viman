type WithRelation<Model, Relations> = Model & Required<Pick<Model, Relations>>
