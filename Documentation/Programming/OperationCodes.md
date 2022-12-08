| Identity | Code    | Left    | Right   | Operand | Description                                                                                                      |
| -------- | ------- | ------- | ------- | ------- | ---------------------------------------------------------------------------------------------------------------- |
| 0        | NOP     |         |         |         | This instruction is used to waste time in a CPU, it costs the time of a single instruction.                      |
| 1        | JUMP    |         |         | ADDRESS | This instruction will allow you to move the program counter and start executing instructions from a new address. |   
| 2        | JUMP_EQ | INPUT_A | INPUT_B | ADDRESS | Jump the program counter to a new execution address if `INPUT_A` and `INPUT_B` are equivilant.                   |
| 3        | JUMP_GT | INPUT_A | INPUT_B | ADDRESS | Jump the program counter to a new execution address if `INPUT_A` is larger than `INPUT_B`.                       |
