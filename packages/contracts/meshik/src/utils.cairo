pub fn validate_order(order: Array<usize>, seeds: Array<felt252>, size: usize) -> bool {
    assert!(order.len() == size, "Order length mismatch");
    assert!(seeds.len() == size, "Seeds length mismatch");

    let mut is_valid = true;

    // Initialize indices array.
    let mut indices = array![];
    for i in 0..size {
        indices.append(i);
    };

    for i in 0..size {
        let index = core::pedersen::pedersen(*seeds.at(i), 0).try_into().unwrap() % (size - i);
        let expected_index = *indices.at(index);

        if *order.at(i.into()) != expected_index {
            is_valid = false;
        }

        let mut copied_indices = ArrayTrait::new();
        for j in 0..indices.len() {
            if j != expected_index {
                copied_indices.append(*indices.at(j.into()));
            }
        };

        indices = copied_indices;
    };
    is_valid
}
